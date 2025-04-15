from fastapi import APIRouter, HTTPException, Depends,status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

from config import settings
from core.security import hash_password
from dependencies.auth import get_current_user, create_access_token

from schemas.user_schema import UserSchema, UserUpdateRequest, CreateUserRequest
from database import get_db, get_all_users, create_user as db_create_user
from models.user import User

router = APIRouter()


@router.get("/", response_model=list[UserSchema])
def get_users(db: Session = Depends(get_db)):
    try:
        return get_all_users(db)
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Failed to fetch users", "details": str(e)},
        )

@router.get("/me", response_model=UserSchema)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/{user_id}", response_model=UserSchema)
def get_user_by_id(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if current_user.id != user_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to access this user.")

    return user

@router.post("/create", response_model=UserSchema)
def create_user(user_data: CreateUserRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter_by(email=user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=user_data.name,
        email=user_data.email,
        hashed_password=hash_password(user_data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # ✅ Auto-login: create JWT
    token = create_access_token({"sub": str(user.id)})

    return JSONResponse(
        content={"access_token": token, "token_type": "bearer", "user_id":user.id},
        status_code=status.HTTP_201_CREATED
    )

@router.put("/{user_id}")
def update_user(
    user_id: int,
    update: UserUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.id != user.id and current_user.email != settings.admin_email:
        raise HTTPException(status_code=403, detail="You are not allowed to update this user")

    if update.name:
        user.name = update.name
    if update.email:
        user.email = update.email

    db.commit()
    db.refresh(user)
    return {"message": "User updated successfully", "user": {"id": user.id, "name": user.name, "email": user.email}}



@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # if user.email == settings.admin_email:
    #     raise HTTPException(status_code=403, detail="Cannot delete admin user")

    db.delete(user)
    db.commit()
    return {"message": f"User {user_id} deleted successfully."}


@router.post("/logout")
def logout(user: User = Depends(get_current_user)):
    return {"message": f"User {user.email} logged out successfully (client must discard token)."}