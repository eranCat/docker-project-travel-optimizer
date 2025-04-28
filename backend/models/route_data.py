from pydantic import BaseModel
from typing import List, Tuple
from .poi import POI

class RouteData(BaseModel):
    pois: List[POI]
    path: List[Tuple[float, float]]


class GeneratePathsResponse(BaseModel):
    routes: List[RouteData]
