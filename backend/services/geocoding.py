from fastapi import HTTPException
import requests
import logging

# Configure logging (you can also use Python's logging module for more robust logging)
logging.basicConfig(level=logging.DEBUG)

def geocode_location(location_text: str) -> tuple[float, float]:
    url = "https://nominatim.openstreetmap.org/search"
    params = {"q": location_text, "format": "json", "limit": 1}
    headers = {"User-Agent": "poi-matcher"}

    try:
        logging.debug(f"Sending request to {url} with params: {params}")
        res = requests.get(url, params=params, headers=headers, timeout=5)
        res.raise_for_status()
        results = res.json()
        logging.debug(f"Response JSON: {results}")

        if not results:
            raise HTTPException(status_code=422, detail=f"Could not geocode location: '{location_text}'")

        lat = float(results[0]["lat"])
        lon = float(results[0]["lon"])
        logging.debug(f"Extracted coordinates: ({lat}, {lon})")
        return lat, lon

    except requests.RequestException as e:
        logging.error(f"Request error: {str(e)}")
        raise HTTPException(status_code=503, detail=f"Geocoding service unavailable: {str(e)}")
    except Exception as e:
        logging.error(f"Unexpected error during geocoding: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error during geocoding: {str(e)}")
