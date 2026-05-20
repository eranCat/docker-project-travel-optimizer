import asyncio
import logging
from typing import List

from models.route_request import RouteGenerationRequest
from models.llm_suggestion import LLMPOISuggestion

from services.maps.overpass_service import (
    get_overpass_tags_from_interests,
    get_pois_from_overpass,
)
from services.generate_optimized_routes import (
    generate_optimized_routes,
    generate_point_to_point_route,
)


async def call_pois_from_maps_service(
    payload: RouteGenerationRequest,
) -> List[LLMPOISuggestion]:
    # Groq call is synchronous (blocking) — offload so the event loop stays
    # responsive (e.g. /health) during generation.
    loop = asyncio.get_running_loop()
    tags = await loop.run_in_executor(
        None, get_overpass_tags_from_interests, payload.interests, payload.time_of_day
    )
    logging.debug(f"Generated tags from interests: {tags}")
    return await get_pois_from_overpass(payload, tuple(tags))


def call_optimized_routes_from_maps_service(
    request: RouteGenerationRequest, pois: List[LLMPOISuggestion]
) -> dict:
    if request.is_point_to_point:
        return generate_point_to_point_route(request, pois)
    return generate_optimized_routes(request, pois)
