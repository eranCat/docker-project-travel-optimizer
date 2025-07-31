import requests
from models.route_request import RouteGenerationRequest
from models.llm_suggestion import LLMPOISuggestion
from typing import List
from fastapi import HTTPException

BASE_URL = "http://maps-service:8000"


def call_pois_from_maps_service(
    payload: RouteGenerationRequest,
) -> List[LLMPOISuggestion]:
    print("🔍 Sending payload to maps_service /pois/:", payload)
    response: Optional[requests.Response] = None
    try:
        response = requests.post(
            f"{BASE_URL}/pois/", json=payload.model_dump(), timeout=30
        )
        response.raise_for_status()
        pois_data = response.json()
        return [LLMPOISuggestion(**poi) for poi in pois_data]
        
    except requests.HTTPError as http_err:
        status_code = http_err.response.status_code if http_err.response else 500
        detail = (
            http_err.response.json().get("detail", "Unknown error from maps_service")
            if http_err.response else str(http_err)
        )
        raise HTTPException(status_code=status_code, detail=detail)

    except Exception as e:
        # only log response text if response exists
        if response is not None:
            print("❗ Response content:", response.text)
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
