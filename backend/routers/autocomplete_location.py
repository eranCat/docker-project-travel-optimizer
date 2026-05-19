import logging
from fastapi import APIRouter, HTTPException
import httpx

router = APIRouter()

@router.get("/autocomplete")
async def autocomplete(q: str):
    logging.debug(f"Autocomplete request for: {q}")
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
            return resp.json()
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Location search timed out. Please try again.")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Location service error: {e.response.status_code}")
    except Exception as e:
        logging.error(f"Autocomplete error: {e}")
        raise HTTPException(status_code=503, detail="Location search is temporarily unavailable.")
