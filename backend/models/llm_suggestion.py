from pydantic import BaseModel
from typing import List,Optional

class LLMPOISuggestion(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    address: Optional[str] = None
    categories: List[str]