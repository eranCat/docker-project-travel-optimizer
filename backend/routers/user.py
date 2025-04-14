from fastapi import APIRouter, HTTPException, Depends,status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

from backend.config import ADMIN_EMAIL
from backend.dependencies.auth import get_current_user, create_access_token

from ..schemas.user_schema import UserSchema, UserUpdateRequest
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

@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    update: UserUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.id != user.id and current_user.email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="You are not allowed to update this user")

    if update.name:
        user.name = update.name
    if update.email:
        user.email = update.email

    db.commit()
    db.refresh(user)
    return {"message": "User updated successfully", "user": {"id": user.id, "name": user.name, "email": user.email}}



@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # if user.email == ADMIN_EMAIL:
    #     raise HTTPException(status_code=403, detail="Cannot delete admin user")

    db.delete(user)
    db.commit()
    return {"message": f"User {user_id} deleted successfully."}

@router.post("/auth/token")
def login(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
def logout(user: User = Depends(get_current_user)):
    return {"message": f"User {user.email} logged out successfully (client must discard token)."}