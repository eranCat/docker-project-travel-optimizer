import requests
from tenacity import retry, stop_after_attempt, wait_exponential
from typing import List
from models.llm_suggestion import LLMPOISuggestion

MAPS_SERVICE_URL = "http://maps-service:8000"

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def call_pois_from_maps_service(request_data: dict) -> List[LLMPOISuggestion]:
    """
    Call the maps service to get POIs based on the request data.
    Includes retry mechanism with exponential backoff.
    """
    try:
        response = requests.post(
            f"{MAPS_SERVICE_URL}/pois/",
            json=request_data,
            timeout=30  # Increased timeout to 30 seconds
        )
        response.raise_for_status()
        return [LLMPOISuggestion(**poi) for poi in response.json()]
    except Exception as e:
        raise Exception(f"Failed to fetch POIs from maps_service: {e}") 