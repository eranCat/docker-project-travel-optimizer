from fastapi import APIRouter, HTTPException
from typing import List

from app import schemas, crud

router = APIRouter()

@router.post("/", response_model=schemas.ItineraryResponse)
async def create_itinerary(itinerary: schemas.ItineraryCreate):
    db_itinerary = await crud.create_itinerary(itinerary)
    return db_itinerary

@router.get("/{itinerary_id}", response_model=schemas.ItineraryResponse)
async def read_itinerary(itinerary_id: str):
    db_itinerary = await crud.get_itinerary(itinerary_id)
    if db_itinerary is None:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    return db_itinerary
