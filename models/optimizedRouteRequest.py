from typing import List
from pydantic import BaseModel

from models.llm_suggestion import LLMPOISuggestion
from models.route_request import RouteGenerationRequest


class OptimizedRouteRequest(BaseModel):
    request: RouteGenerationRequest
    pois: List[LLMPOISuggestion]
