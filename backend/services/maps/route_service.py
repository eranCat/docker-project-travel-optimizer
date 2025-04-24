import openrouteservice
from typing import List, Tuple
import os

ORS_API_KEY = os.getenv("ORS_API_KEY")
ors_client = openrouteservice.Client(key=ORS_API_KEY)


def get_real_route(
    waypoints: List[Tuple[float, float]], profile: str = "foot-walking"
) -> List[Tuple[float, float]]:
    try:
        response = ors_client.directions(
            coordinates=waypoints, profile=profile, format="geojson"
        )
        geometry = response["features"][0]["geometry"]["coordinates"]
        return [(lon, lat) for lon, lat in geometry]
    except Exception as e:
        print("❌ Failed to get ORS route:", str(e))
        return waypoints  # fallback
