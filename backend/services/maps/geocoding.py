from fastapi import HTTPException
import httpx
import logging

logging.basicConfig(level=logging.DEBUG)

async def geocode_location(location_text: str) -> tuple[float, float]:
    url = "https://nominatim.openstreetmap.org/search"
    params = {"q": location_text, "format": "json", "limit": 1}
    headers = {"User-Agent": "poi-matcher"}

    try:
        logging.debug(f"Sending request to {url} with params: {params}")
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(url, params=params, headers=headers)
            res.raise_for_status()
            results = res.json()
            logging.debug(f"Response JSON: {results}")

            if not results:
                raise HTTPException(status_code=422, detail=f"Could not geocode location: '{location_text}'")

            lat = float(results[0]["lat"])
            lon = float(results[0]["lon"])
            logging.debug(f"Extracted coordinates: ({lat}, {lon})")
            return lat, lon

    except httpx.TimeoutException as e:
        logging.error(f"Geocoding timeout: {str(e)}")
        raise HTTPException(status_code=504, detail="Geocoding service timed out")
    except httpx.HTTPError as e:
        logging.error(f"HTTP error: {str(e)}")
        raise HTTPException(status_code=503, detail=f"Geocoding service unavailable: {str(e)}")
    except Exception as e:
        logging.error(f"Unexpected error during geocoding: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error during geocoding: {str(e)}")
