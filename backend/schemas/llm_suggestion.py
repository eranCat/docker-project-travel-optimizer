from pydantic import BaseModel
from typing import List

class LLMPOISuggestion(BaseModel):
    name: str
    description: str
    address: str
    latitude: float
    longitude: float
    categories: List[str]
