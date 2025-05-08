import logging
import random
from typing import List

from fastapi import HTTPException
from app.services.maps.route_service import get_real_route
from models.llm_suggestion import LLMPOISuggestion
from models.route_request import RouteGenerationRequest
from geopy.distance import geodesic


def generate_optimized_routes(request: RouteGenerationRequest, pois: List[LLMPOISuggestion]):
    num_routes = request.num_routes
    num_pois = request.num_pois
    logging.debug(f"Trying to build {num_routes} routes from {len(pois)} POIs")

    if len(pois) < num_pois:
        raise HTTPException(
            status_code=400,
            detail=f"Only {len(pois)} POIs found, but {num_pois} required.",
        )

    TRAVEL_MODE_MAPPING = {
        "walking": "foot-walking",
        "driving": "driving-car",
        "cycling": "cycling-regular",
    }
    ors_profile = TRAVEL_MODE_MAPPING.get(request.travel_mode, "foot-walking")

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
