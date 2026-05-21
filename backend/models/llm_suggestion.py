from pydantic import BaseModel
from typing import List, Optional


class LLMPOISuggestion(BaseModel):
    id: str
    name: str
    name_he: Optional[str] = None
    description: Optional[str] = None
    latitude: float
    longitude: float
    address: Optional[str] = None
    categories: List[str]
    opening_hours: Optional[str] = None
    wheelchair_accessible: Optional[bool] = None
    wiki_title: Optional[str] = None
