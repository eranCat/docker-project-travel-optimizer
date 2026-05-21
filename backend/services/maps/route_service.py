import logging
import re
import openrouteservice
from typing import List, Tuple
from fastapi import HTTPException
from config import settings

ors_client = openrouteservice.Client(key=settings.ors_api_key)


def get_real_route(
    waypoints: List[Tuple[float, float]], profile: str = "foot-walking"
) -> Tuple[List[Tuple[float, float]], float]:
    """Returns (path_coords, duration_seconds).

    If ORS rejects a waypoint (error 2010 — no routable point within radius),
    the bad coordinate is removed and the call is retried. Retries continue
    until the route succeeds or only the two endpoints remain (direct A→B).
    """
    coords = list(waypoints)
    while True:
        try:
            response = ors_client.directions(
                coordinates=coords, profile=profile, format="geojson"
            )
            feature = response["features"][0]
            geometry = feature["geometry"]["coordinates"]
            duration = feature.get("properties", {}).get("summary", {}).get("duration", 0.0)
            path = [(lon, lat) for lon, lat in geometry]
            return path, duration
        except Exception as e:
            msg = str(e)
            m = re.search(r"coordinate (\d+)", msg)
            # Only drop an intermediate waypoint — never touch endpoints (index 0 or last).
            if m and len(coords) > 2:
                bad = int(m.group(1))
                if 0 < bad < len(coords) - 1:
                    logging.warning(
                        f"ORS: dropping unroutable waypoint [{bad}] {coords[bad]} — retrying"
                    )
                    coords.pop(bad)
                    continue
            logging.error(f"❌ ORS routing failed: {type(e).__name__}: {msg}")
            raise HTTPException(
                status_code=503,
                detail="Route service unavailable. Please try again."
            )
