import logging, random
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from services.llm.interest_parser import get_interest_tags_from_ollama
from services.geocoding import geocode_location
from services.maps.overpass_service import get_pois_from_overpass,order_pois_by_proximity
from schemas.poi import POISchema
from database import get_db

router = APIRouter()

def calculate_distance(poi1, poi2) -> float:
    return ((poi1.latitude - poi2.latitude) ** 2 + (poi1.longitude - poi2.longitude) ** 2) ** 0.5

def order_route_with_starting_point(poi_list: List, start_index: int) -> List:
    remaining = poi_list.copy()
    route = []
    starting_point = remaining.pop(start_index)
    route.append(starting_point)
    while remaining:
        next_poi = min(remaining, key=lambda p: calculate_distance(route[-1], p))
        route.append(next_poi)
        remaining.remove(next_poi)
    return route

def perturb_route(route: List, p: float = 0.3) -> List:
    if len(route) > 2 and random.random() < p:
        i = random.randint(1, len(route) - 1)
        j = random.randint(1, len(route) - 1)
        if i != j:
            route[i], route[j] = route[j], route[i]
    return route

@router.post("/generate-paths", response_model=List[List[POISchema]])
def generate_routes(
    interests: str,
    location: str,
    radius_km: float = 2.0,
    num_routes: int = 3,
    num_pois: int = 5,
    db: Session = Depends(get_db)
):
    try:
        coords = geocode_location(location)
        logging.debug(f"DEBUG: coords type: {type(coords)}, value: {coords}")
        if coords is None or len(coords) != 2:
            raise HTTPException(status_code=400, detail="Invalid coordinates returned by geocode_location")
        lat, lon = coords

        tags = get_interest_tags_from_ollama(interests)
        if not tags:
            raise HTTPException(status_code=400, detail="LLM did not return any tags for the provided interests.")

        pois = get_pois_from_overpass((lat, lon), tags, radius_km, debug=False)
        poisLen = len(pois)

        if not pois or poisLen < 2:
            raise HTTPException(status_code=404, detail="Not enough POIs found covering the interests.")
        if poisLen < num_pois:
            raise HTTPException(
                status_code=404, 
                detail=f"Not enough valid POIs (with name, address, and category) to generate a route. Only {poisLen} found."
            )

        logging.debug(f"✅ Valid POIs: {poisLen}")
        all_categories = sorted(set(
            cat for poi in pois for cat in poi.categories if cat
        ))
        logging.debug(f"📋 All POI categories: {all_categories}")

        # Group POIs by category
        category_map = {cat: [] for cat in all_categories}
        for poi in pois:
            for cat in poi.categories:
                if cat in category_map:
                    category_map[cat].append(poi)

        candidate_routes = []
        seen_signatures = set()

        for _ in range(num_routes * 4):  # Try extra times to ensure enough distinct routes
            base = [random.choice(category_map[cat]) for cat in all_categories if category_map[cat]]
            remaining_slots = num_pois - len(base)

            if remaining_slots > 0:
                remaining_pois = [p for p in pois if p not in base]
                if len(remaining_pois) < remaining_slots:
                    continue
                base += random.sample(remaining_pois, remaining_slots)

            start = random.choice(base)
            ordered = order_pois_by_proximity(start, base)
            perturbed = perturb_route(ordered, p=0.3)

            route_signature = tuple(poi.id for poi in perturbed)
            if route_signature not in seen_signatures:
                seen_signatures.add(route_signature)
                candidate_routes.append(perturbed)

            if len(candidate_routes) >= num_routes:
                break

        if not candidate_routes:
            raise HTTPException(status_code=404, detail="Could not generate distinct route options.")

        return candidate_routes

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate routes: {str(e)}")