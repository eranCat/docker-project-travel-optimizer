import logging
import random
from fastapi import APIRouter, HTTPException
from geopy.distance import geodesic

from models.route_request import RouteGenerationRequest
from services.maps.route_service import get_real_route
from services.maps.overpass_service import get_pois_from_overpass

router = APIRouter()

@router.post("/generate-paths")
def generate_paths(request: RouteGenerationRequest):
    # Fetch POIs
    try:
        pois = get_pois_from_overpass(request)
    except HTTPException:
        raise  # propagate HTTP errors
    except Exception as e:
        logging.error(f"Error fetching POIs: {e}")
        raise HTTPException(status_code=503, detail="Failed to retrieve POIs")

    logging.debug(f"Retrieved {len(pois)} POIs")
    routes = []

    # Build each route
    for _ in range(request.num_routes):
        pool = pois.copy()
        selected = []
        used_cats = set()

        # Select diverse POIs
        for _ in range(request.num_pois):
            if not pool:
                break
            if not selected:
                poi = random.choice(pool)
            else:
                last = selected[-1]
                # Prefer POIs introducing new categories
                diverse = [p for p in pool if not used_cats.intersection(p.categories)]
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

        # Skip too-short routes
        if len(selected) < 2:
            continue

        coords = [(p.longitude, p.latitude) for p in selected]
        # Generate real-world path
        try:
            path = get_real_route(coords, profile="foot-walking")
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
