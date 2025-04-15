# backend/schemas/route.py
from pydantic import BaseModel
from typing import List
from schemas.poi import POICreate

class SuggestRouteRequest(BaseModel):
    location: str
    interests: str  # Free-form

class RouteResponse(BaseModel):
    pois: List[POICreate]
    total_distance_km: float
