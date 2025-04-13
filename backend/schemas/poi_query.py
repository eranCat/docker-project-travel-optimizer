from pydantic import BaseModel
from typing import Optional

class POIInterestQuery(BaseModel):
    interests: str
    location: str
    radius_km: Optional[float] = 20.0
    num_results: Optional[int] = 5
