from fastapi import HTTPException
import requests

def geocode_location(location_text: str) -> tuple[float, float]:
    url = "https://nominatim.openstreetmap.org/search"
    params = {"q": location_text, "format": "json", "limit": 1}
    headers = {"User-Agent": "poi-matcher"}

    try:
        res = requests.get(url, params=params, headers=headers, timeout=5)
        res.raise_for_status()
        results = res.json()

        if not results:
            raise HTTPException(status_code=422, detail=f"Could not geocode location: '{location_text}'")

        return float(results[0]["lat"]), float(results[0]["lon"])

    except requests.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Geocoding service unavailable: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error during geocoding: {str(e)}")
