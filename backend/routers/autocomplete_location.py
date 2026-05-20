import logging
from fastapi import APIRouter, HTTPException
import httpx
import time

router = APIRouter()

# In-memory cache: {query -> (expires_at, results)}
_autocomplete_cache: dict = {}
AUTOCOMPLETE_TTL = 300  # 5 minutes
AUTOCOMPLETE_MAX_ENTRIES = 20

@router.get("/autocomplete")
async def autocomplete(q: str):
    logging.debug(f"Autocomplete request for: {q}")

    # Cache lookup
    now = time.time()
    cached = _autocomplete_cache.get(q)
    if cached and cached[0] > now:
        logging.debug(f"Autocomplete cache HIT for '{q}'")
        return cached[1]
    if cached:
        _autocomplete_cache.pop(q, None)

    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": q,
        "format": "json",
        "limit": 5,
        "addressdetails": 1,
    }
    headers = {"User-Agent": "travel-optimizer-backend"}
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            resp.raise_for_status()
            result = resp.json()

            # Cache non-empty results
            if result:
                if len(_autocomplete_cache) >= AUTOCOMPLETE_MAX_ENTRIES:
                    oldest_key = min(_autocomplete_cache, key=lambda k: _autocomplete_cache[k][0])
                    _autocomplete_cache.pop(oldest_key, None)
                _autocomplete_cache[q] = (now + AUTOCOMPLETE_TTL, result)
                logging.debug(f"Autocomplete cache STORE for '{q}'")

            return result
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Location search timed out. Please try again.")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Location service error: {e.response.status_code}")
    except Exception as e:
        logging.error(f"Autocomplete error: {e}")
        raise HTTPException(status_code=503, detail="Location search is temporarily unavailable.")
