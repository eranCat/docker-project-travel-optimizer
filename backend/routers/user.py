from fastapi import APIRouter, HTTPException, Depends,status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

from ..schemas.user_schema import UserSchema
from ..database import get_db, get_all_users, create_user as db_create_user
from ..models.user import User

router = APIRouter()


class CreateUserRequest(BaseModel):
    name: str
    email: str


@router.get("/", response_model=list[UserSchema])
def get_users(db: Session = Depends(get_db)):
    try:
        return get_all_users(db)
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Failed to fetch users", "details": str(e)},
        )


@router.post("/create", response_model=UserSchema)
def create_user(user: CreateUserRequest, db: Session = Depends(get_db)):
    try:
        return db_create_user(db, name=user.name, email=user.email)
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "User already exists", "email": user.email},
        )
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Failed to create user", "details": str(e)},
        )
