from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


# Define the structure for each POI entry in the path
class POIItem(BaseModel):
    poi_id: int
    name: str
    order: int


# Schema for reading a saved path (response model)
class SavedPathSchema(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    path: List[POIItem]

    model_config = {
    "from_attributes": True
}


# Schema for creating a new saved path (request model)
class SavedPathCreate(BaseModel):
    name: str
    description: Optional[str] = None
    path: List[POIItem]
