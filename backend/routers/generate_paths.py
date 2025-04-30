import logging
import random
from fastapi import APIRouter, HTTPException
from geopy.distance import geodesic

from models.route_request import RouteGenerationRequest
from services.maps.route_service import get_real_route
from services.maps.overpass_service import get_overpass_tags_from_interests, get_pois_from_overpass

router = APIRouter()

@router.post("/generate-paths")
def generate_paths(request: RouteGenerationRequest):
    # Fetch POIs
    try:
        tags = get_overpass_tags_from_interests(request.interests)
        pois = get_pois_from_overpass(request,tags)
    except HTTPException:
        raise  # propagate HTTP errors
    except Exception as e:
        logging.error(f"Error fetching POIs: {e}")
        raise HTTPException(status_code=503, detail="Failed to retrieve POIs")

    logging.debug(f"Retrieved {len(pois)} POIs")
    paths = build_paths_from_pois(request.num_routes,request.num_pois,request.travel_mode, pois)
    return paths


def build_paths_from_pois(num_routes, num_pois,travel_mode, pois):
    logging.debug(f"Trying to build {num_routes} routes from {len(pois)} POIs")

    if len(pois) < num_pois:
        raise HTTPException(status_code=400, detail=f"Only {len(pois)} POIs found, but {num_pois} required.")


    TRAVEL_MODE_MAPPING = {
        "walking": "foot-walking",
        "driving": "driving-car",
        "cycling": "cycling-regular",
    }
    ors_profile = TRAVEL_MODE_MAPPING.get(travel_mode, "foot-walking")

    routes = []

    # Build each route
    for _ in range(num_routes):
        pool = pois.copy()
        selected = []
        used_cats = set()

        # Select diverse POIs
        for _ in range(num_pois):
            if not pool:
                break
            if not selected:
                poi = random.choice(pool)
            else:
                last = selected[-1]
                # Prefer POIs introducing new categories
                diverse = [p for p in pool if not used_cats.intersection(p.categories)]
                if len(diverse) < 3:
                    diverse = pool

                if diverse:
                    poi = min(
                        diverse,
                        key=lambda p: geodesic(
                            (last.latitude, last.longitude), (p.latitude, p.longitude)
                        ).meters,
                    )
                else:
                    poi = min(
                        pool,
                        key=lambda p: geodesic(
                            (last.latitude, last.longitude), (p.latitude, p.longitude)
                        ).meters,
                    )
            selected.append(poi)
            used_cats.update(poi.categories)
            pool.remove(poi)
            logging.debug(f"Route selected POIs: {[p.name for p in selected]}")
            logging.debug(f"Route had categories: {used_cats}")


        # Skip too-short routes
        if len(selected) < 2:
            continue

        coords = [(p.longitude, p.latitude) for p in selected]
        # Generate real-world path
        try:
            path = get_real_route(coords, profile=ors_profile)
        except Exception as e:
            logging.error(f"Routing error: {e}")
            continue

        routes.append(
            {
                "feature": {
                    "type": "Feature",
                    "geometry": {"type": "LineString", "coordinates": path},
                },
                "pois": [p.dict() for p in selected],
            }
        )

    if not routes:
        raise HTTPException(
            status_code=400, detail="Could not generate any valid routes."
        )

    return {"routes": routes}
