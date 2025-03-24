from bson.objectid import ObjectId
from app.database import db

async def create_itinerary(itinerary):
    itinerary_dict = itinerary.dict()
    result = await db.itineraries.insert_one(itinerary_dict)
    itinerary_dict["_id"] = str(result.inserted_id)
    return itinerary_dict

async def get_itinerary(itinerary_id: str):
    itinerary = await db.itineraries.find_one({"_id": ObjectId(itinerary_id)})
    if itinerary:
        itinerary["_id"] = str(itinerary["_id"])
    return itinerary
