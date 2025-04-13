# backend/schemas/poi.py
from pydantic import BaseModel
from typing import Optional

class POICreate(BaseModel):
    name: str
    description: Optional[str] = None
    latitude: float
    longitude: float

    model_config = {
        "from_attributes": True
    }
