from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List

from backend.database import get_db
from backend.models.poi import POI
from backend.models.user import User
from backend.schemas.poi import POICreate
from backend.dependencies.auth import get_current_user

router = APIRouter()

@router.post("/pois/", response_model=POICreate)
def create_poi_for_user(
    poi: POICreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        existing_poi = db.query(POI).filter(
            POI.latitude == poi.latitude,
            POI.longitude == poi.longitude
        ).first()

        if existing_poi:
            user.favorite_pois.append(existing_poi)
            db.commit()
            return existing_poi

        db_poi = POI(**poi.model_dump())
        user.favorite_pois.append(db_poi)

        db.add(db_poi)
        db.commit()
        db.refresh(db_poi)
        return db_poi

    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Failed to create POI", "details": str(e)},
        )


@router.get("/pois/", response_model=List[POICreate])
def get_user_pois(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    try:
        return user.favorite_pois
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Failed to fetch POIs", "details": str(e)},
        )
