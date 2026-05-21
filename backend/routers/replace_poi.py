import asyncio
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from geopy.distance import geodesic

from routers.routes_cache import routes_cache
from services.maps.route_service import get_real_route
from services.generate_optimized_routes import (
    _two_opt,
    compute_route_vibe,
    TRAVEL_MODE_MAPPING,
)

router = APIRouter()


class ReplacePOIRequest(BaseModel):
    route_id: str
    route_index: int
    poi_index: int


@router.post("/replace-poi")
async def replace_poi(body: ReplacePOIRequest):
    entry = routes_cache.get_full(body.route_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Route session not found or expired.")

    routes, request_data, pois_pool = entry

    if not (0 <= body.route_index < len(routes)):
        raise HTTPException(status_code=422, detail="Invalid route_index.")

    route = routes[body.route_index]
    route_pois = route["pois"]

    if not (0 <= body.poi_index < len(route_pois)):
        raise HTTPException(status_code=422, detail="Invalid poi_index.")

    target = route_pois[body.poi_index]
    target_cats = set(target.get("categories") or [])
    current_ids = {p["id"] for p in route_pois}

    candidates = [
        p for p in pois_pool
        if set(p.categories) & target_cats and p.id not in current_ids
    ]

    if not candidates:
        # No same-category alternative — fall back to any unused POI in the pool
        candidates = [p for p in pois_pool if p.id not in current_ids]

    if not candidates:
        raise HTTPException(
            status_code=422,
            detail="No alternative POI available — all nearby places are already in this route."
        )

    replacement = min(
        candidates,
        key=lambda p: geodesic(
            (p.latitude, p.longitude),
            (target["latitude"], target["longitude"]),
        ).meters,
    )

    pool_by_id = {p.id: p for p in pois_pool}
    new_suggestions = [
        pool_by_id[p["id"]]
        for p in route_pois
        if p["id"] in pool_by_id and p["id"] != target["id"]
    ]
    new_suggestions.append(replacement)
    new_suggestions = _two_opt(new_suggestions)

    ors_profile = TRAVEL_MODE_MAPPING.get(request_data.travel_mode, "foot-walking")
    coords = [(p.longitude, p.latitude) for p in new_suggestions]

    loop = asyncio.get_running_loop()
    path, duration_seconds = await loop.run_in_executor(
        None, get_real_route, coords, ors_profile
    )

    new_route = {
        "feature": {
            "type": "Feature",
            "geometry": {"type": "LineString", "coordinates": path},
        },
        "pois": [p.model_dump() for p in new_suggestions],
        "duration_seconds": duration_seconds,
        "vibe": compute_route_vibe(new_suggestions),
    }

    updated_routes = list(routes)
    updated_routes[body.route_index] = new_route
    routes_cache.update_routes(body.route_id, updated_routes)

    logging.info(
        f"replace-poi: route {body.route_index} poi {body.poi_index} "
        f"'{target['name']}' → '{replacement.name}'"
    )
    return new_route
