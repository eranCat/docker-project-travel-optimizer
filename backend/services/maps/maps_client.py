import requests
from models.route_request import RouteGenerationRequest
from models.llm_suggestion import LLMPOISuggestion
from typing import List

BASE_URL = "http://maps-service:8000"


def call_pois_from_maps_service(
    request: RouteGenerationRequest,
) -> List[LLMPOISuggestion]:
    try:
        response = requests.post(
            f"{BASE_URL}/pois/", json=request.model_dump(), timeout=10
        )
        response.raise_for_status()
        pois_data = response.json()
        return [LLMPOISuggestion(**poi) for poi in pois_data]
    except requests.HTTPError as http_err:
        print(f"❌ maps_service /pois/ error response: {http_err.response.text}")
        raise Exception(f"Failed to fetch POIs from maps_service: {http_err}")
    except Exception as e:
        raise Exception(f"Failed to fetch POIs from maps_service: {e}")


def call_optimized_routes_from_maps_service(
    request: RouteGenerationRequest, pois: List[LLMPOISuggestion]
) -> dict:
    try:
        response = requests.post(
            f"{BASE_URL}/routes/optimized",
            json={
                "request": request.model_dump(),
                "pois": [p.model_dump() for p in pois],
            },
            timeout=20,
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        raise Exception(f"Failed to call maps_service for optimized routes: {e}")
