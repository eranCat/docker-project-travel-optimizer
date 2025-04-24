import logging
import math
from fastapi import APIRouter, HTTPException
from requests import request
from schemas.overpass import OverpassTag
from schemas.route_request import RouteGenerationRequest
from services.maps.geocoding import geocode_location
from services.maps.overpass_service import (
    get_overpass_tags_from_interests,
    get_pois_from_overpass,
    order_pois_by_proximity,
)
from services.maps.route_service import get_real_route

router = APIRouter()

@router.post("/generate-paths")
def generate_paths(request: RouteGenerationRequest):
    lat, lon = geocode_location(request.location)
    raw_tags = get_overpass_tags_from_interests(request.interests)
    tags = [OverpassTag(**tag) for tag in raw_tags]
    all_pois = get_pois_from_overpass((lat, lon), tags, request.radius_km)

    if len(all_pois) < request.num_pois:
        logging.warning(
            f"⚠️ Only found {len(all_pois)} POIs, requested {request.num_pois}. Proceeding anyway."
        )

    selected_pois = all_pois[:min(request.num_pois * request.num_routes, len(all_pois))]
    chunk_size = math.ceil(len(selected_pois) / request.num_routes)

    routes = []
    for i in range(request.num_routes):
        pois_chunk = selected_pois[i * chunk_size : (i + 1) * chunk_size]
        if len(pois_chunk) < 2:
            continue
        coords = [(poi.longitude, poi.latitude) for poi in pois_chunk]
        path = get_real_route(coords, profile="foot-walking")
        feature = {
            "type": "Feature",
            "geometry": {"type": "LineString", "coordinates": path},
            "properties": {
                "interests": request.interests,
                "location": request.location,
                "poi_count": len(pois_chunk),
            },
        }
        # assume POI objects are dict-serializable
        routes.append({"feature": feature, "pois": [poi.__dict__ for poi in pois_chunk]})

    if not routes:
        raise HTTPException(400, "Could not generate any valid routes.")
    return {"routes": routes}
