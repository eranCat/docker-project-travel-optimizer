import logging
from fastapi import FastAPI
from typing import List, Tuple, Dict

from app.services.maps.geocoding import geocode_location
from app.services.maps.overpass_service import (
    get_overpass_tags_from_interests,
    get_pois_from_overpass,
)
from app.services.generate_optimized_routes import generate_optimized_routes

from models.route_request import RouteGenerationRequest
from models.llm_suggestion import LLMPOISuggestion


app = FastAPI(
    title="Maps & Routing API",
    description="Geocoding, POI-matching and route-generation endpoints",
    version="0.1.0",
)


@app.get("/geocode/", response_model=Tuple[float, float])
async def geocode(location: str):
    """
    Convert a location string to latitude/longitude.
    """
    lat, lon = geocode_location(location)
    return lat, lon


@app.post("/pois/", response_model=List[LLMPOISuggestion])
async def pois(request: RouteGenerationRequest):
    """
    Given interests, location, radius, num_routes etc. return a list of POIs.
    """
    logging.info("🧭 /pois/ endpoint hit")
    logging.info("METHOD HITTING /pois/:", request.method)
    tags = get_overpass_tags_from_interests(request.interests)
    logging.debug(f"Generated tags from interests: {tags}")
    pois = get_pois_from_overpass(request,tags)
    return pois

@router.get("/pois/")
def get_pois_debug(request: Request):
    print("🚨 GOT GET /pois/ from:", request.client)
    raise HTTPException(status_code=405, detail="Use POST instead.")


@app.post("/routes/optimized")
async def routes(request: Dict):
    """
    Generate optimized routes based on request parameters and POIs.
    """
    route_request = RouteGenerationRequest(**request["request"])
    pois = [LLMPOISuggestion(**poi) for poi in request["pois"]]
    return generate_optimized_routes(route_request, pois)


@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {"status": "healthy"}
