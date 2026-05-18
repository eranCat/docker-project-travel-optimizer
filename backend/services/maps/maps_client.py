import logging
from typing import List

from models.route_request import RouteGenerationRequest
from models.llm_suggestion import LLMPOISuggestion

from services.maps.overpass_service import (
    get_overpass_tags_from_interests,
    get_pois_from_overpass,
)
from services.generate_optimized_routes import generate_optimized_routes


def call_pois_from_maps_service(
    payload: RouteGenerationRequest,
) -> List[LLMPOISuggestion]:
    tags = get_overpass_tags_from_interests(payload.interests)
    logging.debug(f"Generated tags from interests: {tags}")
    return get_pois_from_overpass(payload, tuple(tags))


def call_optimized_routes_from_maps_service(
    request: RouteGenerationRequest, pois: List[LLMPOISuggestion]
) -> dict:
    return generate_optimized_routes(request, pois)
