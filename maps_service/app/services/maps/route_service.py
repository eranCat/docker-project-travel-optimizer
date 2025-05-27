import openrouteservice
from typing import List, Tuple
from app.config import settings

ors_client = openrouteservice.Client(key=settings.ors_api_key)


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
