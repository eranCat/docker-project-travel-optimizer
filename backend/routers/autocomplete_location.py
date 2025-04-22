from fastapi import APIRouter
import httpx

router = APIRouter()

@router.get("/autocomplete")
async def autocomplete(q: str):
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": q,
        "format": "json",
        "limit": 5,
        "addressdetails": 1,
    }
    headers = {"User-Agent": "travel-optimizer-backend"}
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params, headers=headers)
        resp.raise_for_status()
        return resp.json()
