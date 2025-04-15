from pydantic import BaseModel
from typing import Optional

class POIInterestQuery(BaseModel):
    interests: str
    location: str
    radius_km: float = 10
    num_results: int = 10
    debug: Optional[bool] = False
