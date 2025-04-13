from typing import List
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from backend.database import get_db
from ..schemas.saved_path import SavedPathCreate, SavedPathSchema
from backend.models.saved_path import SavedPath
from backend.models.user import User

router = APIRouter()

@router.get("/", response_model=List[SavedPathSchema])
def get_saved_paths(user_id: int, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail={"error": "User not found"})

        return user.saved_paths

    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Failed to fetch saved paths", "details": str(e)},
        )

@router.post("/", response_model=SavedPathSchema)
def create_saved_path(
    saved_path: SavedPathCreate, user_id: int, db: Session = Depends(get_db)
):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail={"error": "User not found"})

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

    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Failed to create saved path", "details": str(e)},
        )
