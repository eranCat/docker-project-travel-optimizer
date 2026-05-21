import asyncio
import json
import logging
import traceback
from fastapi import APIRouter, HTTPException
from services.maps.maps_client import (
    call_optimized_routes_from_maps_service,
    fetch_overpass_tags,
    fetch_pois_with_tags,
)
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
    time_of_day: str | None = None,
    dest_location: str | None = None,
    dest_latitude: float | None = None,
    dest_longitude: float | None = None,
    lang: str = "en",
):
    async def event_generator():
        clear_log()
        tags_task: asyncio.Task | None = None
        try:
            # Kick off Groq tag generation immediately — it only needs interests +
            # time_of_day, so it runs concurrently with geocoding below.
            tags_task = asyncio.create_task(fetch_overpass_tags(interests, time_of_day))

            need_origin_geocode = latitude is None or longitude is None
            need_dest_geocode = bool(dest_location) and (
                dest_latitude is None or dest_longitude is None
            )
            if need_origin_geocode or need_dest_geocode:
                yield {"event": "stage", "data": "Geocoding location"}

            # Geocode origin and destination concurrently when both are needed.
            geocode_jobs = []
            if need_origin_geocode:
                geocode_jobs.append(("origin", geocode_location(location)))
            if need_dest_geocode:
                geocode_jobs.append(("dest", geocode_location(dest_location)))

            geocoded = {}
            if geocode_jobs:
                results = await asyncio.gather(*(coro for _, coro in geocode_jobs))
                geocoded = {label: res for (label, _), res in zip(geocode_jobs, results)}

            if need_origin_geocode:
                lat, lon = geocoded["origin"]
            else:
                lat, lon = latitude, longitude
                logging.debug(f"Using pre-geocoded coords: ({lat}, {lon})")

            if need_dest_geocode:
                d_lat, d_lon = geocoded["dest"]
            else:
                d_lat, d_lon = dest_latitude, dest_longitude

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
                time_of_day=time_of_day,
                dest_location=dest_location,
                dest_latitude=d_lat,
                dest_longitude=d_lon,
                lang=lang,
            )

            yield {"event": "stage", "data": "Fetching POIs from maps_service"}
            tags = await tags_task
            yield {"event": "detail", "data": json.dumps({"tags": len(tags)})}
            pois = await fetch_pois_with_tags(request_data, tags)
            yield {"event": "detail", "data": json.dumps({"pois": len(pois)})}
            # A→B mode still produces a valid direct route with zero POIs.
            if not pois and not request_data.is_point_to_point:
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
            yield {"event": "detail", "data": json.dumps({"routes": len(result["routes"])})}

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

        finally:
            # If we bailed before awaiting the tags task, cancel it so it doesn't
            # leak or surface an unretrieved-exception warning.
            if tags_task is not None and not tags_task.done():
                tags_task.cancel()

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
