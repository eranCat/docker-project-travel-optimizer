from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import func
from typing import List
import json

from backend.database import get_db
from backend.models.poi import POI
from backend.models.user import User
from backend.schemas.poi import POICreate
from backend.schemas.poi_query import POIInterestQuery
from backend.schemas.llm_suggestion import LLMPOISuggestion
from backend.dependencies.auth import get_current_user
from backend.services.geocoding import geocode_location
from backend.services.llm.prompt_builder import build_poi_prompt
from backend.services.llm.llm_query import query_llm

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


@router.post("/match-pois-llm", response_model=List[LLMPOISuggestion])
def match_pois_with_ollama(query: POIInterestQuery, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # 1. Save interests
    user.interests_text = query.interests
    db.commit()

    # 2. Geocode location text
    lat, lon = geocode_location(query.location)  # always returns valid coords
    

    # 3. Proximity filter
    R = query.radius_km
    nearby_pois = db.query(POI).filter(
        R * func.acos(
            func.cos(func.radians(lat)) *
            func.cos(func.radians(POI.latitude)) *
            func.cos(func.radians(POI.longitude) - func.radians(lon)) +
            func.sin(func.radians(lat)) * func.sin(func.radians(POI.latitude))
        ) <= query.radius_km
    ).all()

    # 4. LLM match
    prompt = build_poi_prompt(query, nearby_pois)
    llm_response = query_llm(prompt)

    try:
        suggestions = json.loads(llm_response)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="LLM response was not valid JSON")

    return suggestions
