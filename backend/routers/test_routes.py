import asyncio
import time
import logging
from typing import Optional

from fastapi import APIRouter, Query

from config import settings
from models.route_request import RouteGenerationRequest
from services.maps.geocoding import geocode_location
from services.maps.maps_client import (
    call_optimized_routes_from_maps_service,
    fetch_overpass_tags,
    fetch_pois_with_tags,
)
from services.maps.overpass_service import _poi_cache, POI_CACHE_TTL, _fetch_overpass_elements
from services.maps.route_service import ors_client

router = APIRouter(prefix="/test", tags=["test"])

# Default test location: Tel Aviv city centre
_DEFAULT_LAT = 32.0853
_DEFAULT_LON = 34.7818


@router.get("/groq")
async def test_groq(
    interests: str = Query(default="bars, parks, museums"),
    time_of_day: Optional[str] = Query(default=None),
):
    """Call Groq tag generation and return tags + latency."""
    t0 = time.perf_counter()
    tags = await fetch_overpass_tags(interests, time_of_day)
    latency = round(time.perf_counter() - t0, 3)
    return {
        "ok": True,
        "latency_s": latency,
        "interests": interests,
        "tags": [{"key": t.key, "value": t.value} for t in tags],
        "count": len(tags),
    }


@router.get("/overpass")
def test_overpass(
    lat: float = Query(default=_DEFAULT_LAT),
    lon: float = Query(default=_DEFAULT_LON),
    radius_km: float = Query(default=1.0),
):
    """Fire a minimal Overpass query (amenity=cafe within radius) using production parallel mirror logic."""
    query = f"[out:json][timeout:18];(node[\"amenity\"=\"cafe\"](around:{int(radius_km * 1000)},{lat},{lon});way[\"amenity\"=\"cafe\"](around:{int(radius_km * 1000)},{lat},{lon}););out center qt tags;"

    t0 = time.perf_counter()
    try:
        elements = _fetch_overpass_elements(query)
        latency = round(time.perf_counter() - t0, 3)
        return {
            "ok": True,
            "latency_s": latency,
            "element_count": len(elements),
            "mirror_used": "parallel race",
            "lat": lat,
            "lon": lon,
            "radius_km": radius_km,
        }
    except Exception as e:
        latency = round(time.perf_counter() - t0, 3)
        return {"ok": False, "latency_s": latency, "error": str(e)}


@router.get("/ors")
def test_ors(
    lat: float = Query(default=_DEFAULT_LAT),
    lon: float = Query(default=_DEFAULT_LON),
):
    """Fire a minimal ORS walking route (~300 m north) and return duration + latency."""
    # Two points ~300 m apart
    waypoints = [(lon, lat), (lon, lat + 0.003)]
    t0 = time.perf_counter()
    try:
        resp = ors_client.directions(
            coordinates=waypoints, profile="foot-walking", format="geojson"
        )
        duration = (
            resp["features"][0].get("properties", {}).get("summary", {}).get("duration", 0)
        )
        latency = round(time.perf_counter() - t0, 3)
        return {"ok": True, "latency_s": latency, "duration_s": duration}
    except Exception as e:
        latency = round(time.perf_counter() - t0, 3)
        return {"ok": False, "latency_s": latency, "error": str(e)}


@router.get("/cache")
def test_cache():
    """Show current POI cache entries: key, POI count, seconds until expiry."""
    t0 = time.perf_counter()
    now = time.time()
    entries = []
    for key, (expires_at, pois) in list(_poi_cache.items()):
        ttl_remaining = round(expires_at - now, 1)
        location, radius_km, num_pois = key[0], key[1], key[2]
        entries.append({
            "location": location,
            "radius_km": radius_km,
            "num_pois": num_pois,
            "poi_count": len(pois),
            "ttl_remaining_s": ttl_remaining,
            "expired": ttl_remaining <= 0,
        })
    entries.sort(key=lambda e: e["ttl_remaining_s"], reverse=True)
    return {
        "ok": True,
        "latency_s": round(time.perf_counter() - t0, 3),
        "total_entries": len(entries),
        "cache_ttl_s": POI_CACHE_TTL,
        "entries": entries,
    }


@router.get("/route")
async def test_route(
    interests: str = Query(default="parks, cafes, museums"),
    location: str = Query(default="Tel Aviv, Israel"),
    radius_km: float = Query(default=2.0),
    num_routes: int = Query(default=2),
    num_pois: int = Query(default=4),
    travel_mode: str = Query(default="walking"),
    latitude: Optional[float] = Query(default=None),
    longitude: Optional[float] = Query(default=None),
    time_of_day: Optional[str] = Query(default=None),
    lang: str = Query(default="en"),
):
    """Run the full route pipeline synchronously and return JSON (no SSE)."""
    t0 = time.perf_counter()
    stages: list[dict] = []

    def stage(name: str, extra: dict | None = None):
        stages.append({"stage": name, "elapsed_s": round(time.perf_counter() - t0, 3), **(extra or {})})

    # --- Groq tags (concurrent with geocoding) ---
    tags_task = asyncio.create_task(fetch_overpass_tags(interests, time_of_day))

    # --- Geocode ---
    if latitude is None or longitude is None:
        lat, lon = await geocode_location(location)
        stage("geocode", {"lat": lat, "lon": lon})
    else:
        lat, lon = latitude, longitude
        stage("geocode", {"lat": lat, "lon": lon, "skipped": True})

    tags = await tags_task
    stage("groq", {"tags": [f"{t.key}={t.value}" for t in tags]})

    # --- Overpass ---
    request_data = RouteGenerationRequest(
        location=location,
        interests=interests,
        radius_km=radius_km,
        num_routes=num_routes,
        num_pois=num_pois,
        travel_mode=travel_mode,
        latitude=lat,
        longitude=lon,
        time_of_day=time_of_day,
        lang=lang,
    )
    pois = await fetch_pois_with_tags(request_data, tags)
    stage("overpass", {"poi_count": len(pois)})

    if not pois:
        return {
            "ok": False,
            "error": f"No POIs found for interests='{interests}' at '{location}' within {radius_km} km",
            "stages": stages,
        }

    # --- Route building ---
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(None, call_optimized_routes_from_maps_service, request_data, pois)
    stage("routes", {"route_count": len(result["routes"])})

    total_s = round(time.perf_counter() - t0, 3)

    # Summarise routes (names only, not full geometry)
    summaries = []
    for r in result["routes"]:
        pois_in_route = r.get("pois", [])
        summaries.append({
            "poi_names": [p.get("name") for p in pois_in_route],
            "categories": [p.get("categories", []) for p in pois_in_route],
            "duration_s": r.get("duration_seconds"),
        })

    return {
        "ok": True,
        "total_s": total_s,
        "stages": stages,
        "interests": interests,
        "location": location,
        "routes": summaries,
    }
