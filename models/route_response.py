from pydantic import BaseModel
from typing import List, Dict, Any


class RouteResponse(BaseModel):
    routes: List[Dict[str, Any]]
