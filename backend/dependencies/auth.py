# backend/dependencies/auth.py
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.user import User

def get_current_user(db: Session = Depends(get_db)) -> User:
    # Replace this with real JWT/token auth logic
    # For now, simulate user with ID 1
    user = db.query(User).filter(User.id == 1).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "User not found"})
    return user
