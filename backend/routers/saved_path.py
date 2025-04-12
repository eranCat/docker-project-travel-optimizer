# backend/routers/saved_path.py
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from ..schemas.saved_path import SavedPathCreate, SavedPathSchema
from backend.models.saved_path import SavedPath
from backend.models.user import User

router = APIRouter()


# Endpoint to retrieve all saved paths for a user
@router.get("/", response_model=List[SavedPathSchema])
def get_saved_paths(user_id: int, db: Session = Depends(get_db)):
    # Check that the user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user.saved_paths


# Endpoint to create a new saved path for a user
@router.post("/", response_model=SavedPathSchema)
def create_saved_path(
    saved_path: SavedPathCreate, user_id: int, db: Session = Depends(get_db)
):
    # Check that the user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_path = SavedPath(
        name=saved_path.name,
        description=saved_path.description,
        path=saved_path.path,
        user_id=user_id,
    )
    db.add(new_path)
    db.commit()
    db.refresh(new_path)
    return new_path
