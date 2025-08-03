# backend/routers/autocomplete.py
from fastapi import APIRouter, Query
import httpx

router = APIRouter()

@router.get("/autocomplete")
async def autocomplete(q: str = Query(..., min_length=2)):
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": q,
        "format": "json",
        "limit": 5,
        "addressdetails": 1,
    }
    headers = {"User-Agent": "travel-optimizer-backend"}

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params, headers=headers)
        response.raise_for_status()
        return response.json()
