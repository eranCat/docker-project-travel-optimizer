import requests
import logging

logger = logging.getLogger(__name__)

DEFAULT_LOCATION_NAME = "Tel Aviv"
DEFAULT_LOCATION_COORDS = (32.0853, 34.7818)  # Tel Aviv center

def geocode_location(location_text: str) -> tuple[float, float]:
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": location_text,
        "format": "json",
        "limit": 1
    }
    headers = {
        "User-Agent": "poi-matcher"
    }

    try:
        res = requests.get(url, params=params, headers=headers, timeout=5)
        res.raise_for_status()

        results = res.json()
        if not results:
            logger.warning(f"⚠️ Could not geocode '{location_text}', using default location '{DEFAULT_LOCATION_NAME}'.")
            return DEFAULT_LOCATION_COORDS

        return float(results[0]["lat"]), float(results[0]["lon"])

    except Exception as e:
        logger.warning(f"⚠️ Geocoding error for '{location_text}': {e}. Using fallback location.")
        return DEFAULT_LOCATION_COORDS
