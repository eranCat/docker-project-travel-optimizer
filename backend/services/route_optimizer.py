# backend/services/route_optimizer.py
from typing import List, Tuple
from schemas.route import POI
from math import radians, cos, sin, sqrt, atan2

def haversine_distance(p1: POI, p2: POI) -> float:
    R = 6371  # km
    dlat = radians(p2.latitude - p1.latitude)
    dlon = radians(p2.longitude - p1.longitude)
    lat1 = radians(p1.latitude)
    lat2 = radians(p2.latitude)
    
    a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
    return 2 * R * atan2(sqrt(a), sqrt(1 - a))

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
