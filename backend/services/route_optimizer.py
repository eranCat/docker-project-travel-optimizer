# backend/services/route_optimizer.py
from typing import List, Tuple
from models.poi import POI
from math import radians, cos, sin, sqrt, asin

def haversine_distance(p1: tuple[float, float], p2: tuple[float, float]) -> float:
    lat1, lon1 = p1
    lat2, lon2 = p2

    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371  # Radius of earth in kilometers
    return c * r


def optimize_route(pois: List[POI]) -> Tuple[List[POI], float]:
    if not pois:
        return [], 0.0

    unvisited = pois.copy()
    current = unvisited.pop(0)
    route = [current]
    total_dist = 0.0

    while unvisited:
        next_poi = min(unvisited, key=lambda p: haversine_distance(current, p))
        dist = haversine_distance(current, next_poi)
        total_dist += dist
        route.append(next_poi)
        current = next_poi
        unvisited.remove(next_poi)

    return route, total_dist
