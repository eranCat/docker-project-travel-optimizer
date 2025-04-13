# backend/routers/poi_query.py
from sqlalchemy import func
from backend.services.poi_matcher import build_poi_prompt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.models.poi import POI
from backend.schemas.poi_query import POIInterestQuery
from backend.models.user import User
from backend.dependencies.auth import get_current_user
from backend.services.geocoding import geocode_location
from backend.services.llm_query import query_llm
from backend.schemas.llm_suggestion import LLMPOISuggestion
import json




router = APIRouter()


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

