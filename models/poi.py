# backend/models/poi.py
from pydantic import BaseModel
from typing import Optional


class POI(BaseModel):
    name: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    address: Optional[str] = None
    category: Optional[str] = None