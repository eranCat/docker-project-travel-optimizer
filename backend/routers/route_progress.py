import asyncio
import json
import logging
import traceback
from fastapi import APIRouter, HTTPException
from models.route_request import RouteGenerationRequest
from routers.generate_paths import build_paths_from_pois
from services.maps.overpass_service import get_overpass_tags_from_interests, get_pois_from_overpass
from sse_starlette.sse import EventSourceResponse
import uuid
from routers.routes_cache import routes_cache

router = APIRouter()


@router.get("/route-progress")
async def route_progress(
    location: str,
    interests: str,
    radius_km: float,
    num_routes: int,
    num_pois: int,
    travel_mode : str,
):
    async def event_generator():
        try:
            yield {"event": "stage", "data": "Converting interests to tags"}
            tags = get_overpass_tags_from_interests(interests)
            logging.debug(f"Tags generated from interests: {tags}")
            await asyncio.sleep(0.1)

            yield {"event": "stage", "data": "Fetching POIs"}
            request_data = RouteGenerationRequest(
                location=location,
                interests=interests,
                radius_km=radius_km,
                num_routes=num_routes,
                num_pois=num_pois,
                travel_mode=travel_mode,
            )
            pois = get_pois_from_overpass(request_data,tags)
            if not pois:
                yield {
                    "event": "error",
                    "data": json.dumps(
                        {
                            "message": f"Only 0 POIs found for interests '{interests}' at '{location}' within {radius_km} km.",
                            "suggestions": [
                                "Try increasing the search radius.",
                                "Try more general interests like 'parks, food, museums'.",
                                "Make sure the location is specific and spelled correctly.",
                            ],
                        }
                    ),
                }

            await asyncio.sleep(0.1)

            yield {"event": "stage", "data": "Filtering & thinning POIs"}
            await asyncio.sleep(0.1)

            yield {"event": "stage", "data": "Building routes"}
            routes = build_paths_from_pois(num_routes, num_pois,travel_mode ,pois)
            await asyncio.sleep(0.1)

            route_id = str(uuid.uuid4())
            routes_cache[route_id] = routes

            yield {"event": "complete", "data": route_id}

        except Exception as e:
            logging.exception("❌ Exception in route-progress")

            message = str(e)
            if not message:
                message = traceback.format_exc(limit=1).splitlines()[-1]
            yield {"event": "error", "data": message}

    return EventSourceResponse(event_generator())


@router.get("/get-latest-routes/{route_id}")
async def get_latest_routes(route_id: str):
    print(f"📦 Requested route_id: {route_id}")
    print(f"🧠 Available route cache keys: {list(routes_cache.keys())}")

    routes = routes_cache.get(route_id)
    if not routes:
        print(f"❌ Route ID not found: {route_id}")
        raise HTTPException(status_code=404, detail="Routes not found")
    print(f"✅ Returning {len(routes)} routes for {route_id}")
    return {"routes": routes}
