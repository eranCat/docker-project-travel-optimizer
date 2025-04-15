# backend/schemas/poi.py
from pydantic import BaseModel
from typing import Optional,List

class POICreate(BaseModel):
    name: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    address: Optional[str] = None
    categories: Optional[List[str]] = None

    model_config = {
        "from_attributes": True
    }

class POISchema(POICreate):
    id: int
