from app.database import db
from app import schemasonal
from bson.objectid import ObjectId

async def create_itinerary(itinerary: schemas.ItineraryCreate):
    itinerary_dict = itinerary.dict() #of attraction IDs
    result = await db.itineraries.insert_one(itinerary_dict)
    itinerary_dict["_id"] = str(result.inserted_id)
    return itinerary_dict

async def get_itinerary(itinerary_id: str):
    itinerary = await db.itineraries.find_one({"_id": ObjectId(itinerary_id)})
    if itinerary:# MongoDB's ObjectId as a string
        itinerary["_id"] = str(itinerary["_id"])
    return itinerary
