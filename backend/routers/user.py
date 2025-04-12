from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..schemes.user_schema import UserSchema
from ..database import get_db, get_all_users, create_user as db_create_user
from ..models.user import User

router = APIRouter()


class CreateUserRequest(BaseModel):
    name: str
    email: str


@router.get("/", response_model=list[UserSchema])
def get_users(db: Session = Depends(get_db)):
    return get_all_users(db)


@router.post("/create", response_model=UserSchema)
def create_user(user: CreateUserRequest, db: Session = Depends(get_db)):
    return db_create_user(db, name=user.name, email=user.email)
