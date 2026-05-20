import logging
import openrouteservice
from typing import List, Tuple
from fastapi import HTTPException
from config import settings

ors_client = openrouteservice.Client(key=settings.ors_api_key)


def get_real_route(
    waypoints: List[Tuple[float, float]], profile: str = "foot-walking"
) -> Tuple[List[Tuple[float, float]], float]:
    """Returns (path_coords, duration_seconds)."""
    try:
        response = ors_client.directions(
            coordinates=waypoints, profile=profile, format="geojson"
        )
        feature = response["features"][0]
        geometry = feature["geometry"]["coordinates"]
        duration = feature.get("properties", {}).get("summary", {}).get("duration", 0.0)
        path = [(lon, lat) for lon, lat in geometry]
        return path, duration
    except Exception as e:
        logging.error(f"❌ ORS routing failed: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="Route service unavailable. Please try again."
        )
