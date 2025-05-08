import asyncio
import json
import logging
import traceback
from fastapi import APIRouter, HTTPException
from services.maps.maps_client import call_optimized_routes_from_maps_service, call_pois_from_maps_service
from models.route_request import RouteGenerationRequest
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
            # Build request
            request_data = RouteGenerationRequest(
                location=location,
                interests=interests,
                radius_km=radius_km,
                num_routes=num_routes,
                num_pois=num_pois,
                travel_mode=travel_mode,
            )

            yield {"event": "stage", "data": "Fetching POIs from maps_service"}
            pois = call_pois_from_maps_service(request_data)
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
                return

            await asyncio.sleep(0.1)

            yield {"event": "stage", "data": "Generating optimized routes"}
            routes = call_optimized_routes_from_maps_service(request_data, pois)

            await asyncio.sleep(0.1)

            route_id = str(uuid.uuid4())
            routes_cache[route_id] = routes

            yield {"event": "complete", "data": route_id}

        except Exception as e:
            logging.exception("❌ Exception in route-progress")

            message = str(e) or traceback.format_exc(limit=1).splitlines()[-1]
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
