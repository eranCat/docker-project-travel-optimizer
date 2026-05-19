# backend/models/poi.py
from pydantic import BaseModel, Field
from typing import Optional


class POI(BaseModel):
    name: str
    description: Optional[str] = None
    latitude: float = Field(..., ge=-90, le=90, description="Latitude coordinate")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude coordinate")
    address: Optional[str] = None
    category: Optional[str] = None