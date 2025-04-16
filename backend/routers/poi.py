import sys
import traceback
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List

from services.maps.overpass_service import get_pois_from_overpass,get_overpass_tags_from_interests
from database import get_db
from models.poi import POI
from models.user import User
from schemas.poi import POICreate
from schemas.poi_query import POIInterestQuery
from schemas.llm_suggestion import LLMPOISuggestion
from dependencies.auth import get_current_user
from services.geocoding import geocode_location

router = APIRouter()
    
@router.post("/match-pois-overpass", response_model=List[LLMPOISuggestion])
def match_pois_with_overpass(
    query: POIInterestQuery,
    db: Session = Depends(get_db)
):
    try:
        location = geocode_location(query.location)
        overpass_tags = get_overpass_tags_from_interests(query.interests)

        print("📍 Location:", location)
        print("🎯 Categories:", overpass_tags)

        pois = get_pois_from_overpass(
            location=location,
            overpass_tags=overpass_tags,
            radius_km=query.radius_km,
            debug=query.debug
        )

        minAmount = min(query.num_results, len(pois))
        return pois[:minAmount]

    except Exception as e:
        print("❌ Exception caught in /match-pois-overpass", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)  # This will show the full traceback
        raise HTTPException(status_code=500, detail=f"Failed to match POIs: {str(e)}")

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