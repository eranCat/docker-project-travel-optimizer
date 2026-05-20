import asyncio
import json
import logging
import traceback
from fastapi import APIRouter, HTTPException
from services.maps.maps_client import call_optimized_routes_from_maps_service, call_pois_from_maps_service
from services.maps.geocoding import geocode_location
from models.route_request import RouteGenerationRequest
from sse_starlette.sse import EventSourceResponse
import uuid
from routers.routes_cache import routes_cache
from utils.log_cleanup import cleanup_logs, clear_log

router = APIRouter()
_generation_count = 0


@router.get("/route-progress")
async def route_progress(
    location: str,
    interests: str,
    radius_km: float,
    num_routes: int,
    num_pois: int,
    travel_mode: str,
    latitude: float | None = None,
    longitude: float | None = None,
    wheelchair: bool = False,
):
    async def event_generator():
        clear_log()
        try:
            # Use pre-geocoded coordinates if provided, otherwise geocode
            if latitude is not None and longitude is not None:
                lat, lon = latitude, longitude
                logging.debug(f"Using pre-geocoded coords: ({lat}, {lon})")
            else:
                yield {"event": "stage", "data": "Geocoding location"}
                lat, lon = await geocode_location(location)

            # Build request with geocoded coordinates
            request_data = RouteGenerationRequest(
                location=location,
                interests=interests,
                radius_km=radius_km,
                num_routes=num_routes,
                num_pois=num_pois,
                travel_mode=travel_mode,
                latitude=lat,
                longitude=lon,
                wheelchair=wheelchair,
            )

            yield {"event": "stage", "data": "Fetching POIs from maps_service"}
            pois = await call_pois_from_maps_service(request_data)
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
            loop = asyncio.get_running_loop()
            result = await loop.run_in_executor(None, call_optimized_routes_from_maps_service, request_data, pois)

            await asyncio.sleep(0.1)

            route_id = str(uuid.uuid4())
            routes_cache[route_id] = result["routes"]

            global _generation_count
            _generation_count += 1
            if _generation_count % 3 == 0:
                cleanup_logs()
                logging.info(f"Cleaned up logs after {_generation_count} generations")

            yield {"event": "complete", "data": route_id}

        except HTTPException as http_exc:
            logging.exception("HTTPException in route-progress")
            yield {"event": "error", "data": json.dumps({"message": http_exc.detail})}
            return

        except Exception as e:
            logging.exception("Exception in route-progress")
            message = str(e) or traceback.format_exc(limit=1).splitlines()[-1]
            yield {"event": "error", "data": json.dumps({"message": message})}
            return

    return EventSourceResponse(event_generator())


@router.get("/get-latest-routes/{route_id}")
async def get_latest_routes(route_id: str):
    logging.info(f"Requested route_id: {route_id}")
    routes = routes_cache.get(route_id)
    if not routes:
        logging.warning(f"Route ID not found: {route_id}")
        raise HTTPException(status_code=404, detail="Routes not found")
    logging.info(f"Returning {len(routes)} routes for {route_id}")
    return {"routes": routes}
