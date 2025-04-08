from pydantic import BaseModel
from typing import List, Optional
from app.db import Base  # Use this if it's really required


class Edge(BaseModel):
    from_node: str
    to_node: str
    distance: float

class PathRequest(BaseModel):
    nodes: List[str]
    edges: List[Edge]
    start: str
    end: str
    constraints: Optional[dict] = {}

class PathResponse(BaseModel):
    optimal_path: List[str]
    total_distance: float