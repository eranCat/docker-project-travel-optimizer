import logging, random
from fastapi import APIRouter, HTTPException
from typing import List, Set, Tuple
from schemas.overpass import OverpassTag
from schemas.route_request import RouteGenerationRequest
from services.maps.geocoding import geocode_location
from services.maps.overpass_service import (
    get_overpass_tags_from_interests,
    get_pois_from_overpass,
    order_pois_by_proximity,
)
from schemas.poi import POISchema

router = APIRouter()


def calculate_distance(poi1, poi2) -> float:
    return (
        (poi1.latitude - poi2.latitude) ** 2 + (poi1.longitude - poi2.longitude) ** 2
    ) ** 0.5


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
def generate_routes(request: RouteGenerationRequest):
    logging.debug(f"Requesting routes with: {request}")
    try:
        lat, lon = geocode_location(request.location)
        if lat is None or lon is None:
            raise HTTPException(status_code=400, detail="Invalid location")
        logging.debug(f"📍 Coordinates: lat={lat}, lon={lon}")

        raw_tags = get_overpass_tags_from_interests(request.interests)
        if not raw_tags:
            raise HTTPException(
                status_code=400,
                detail="LLM did not return any relevant tags for your interests. Try using more general or different interests.",
            )
        try:
            tags = [
                tag if isinstance(tag, OverpassTag) else OverpassTag(**tag)
                for tag in raw_tags
                if isinstance(tag, (dict, OverpassTag))
            ]
            logging.debug(f"🧠 Tags: {tags}")
        except Exception as e:
            raise HTTPException(
                status_code=422, detail=f"Invalid Overpass parameters: {str(e)}"
            )

        pois = get_pois_from_overpass((lat, lon), tags, request.radius_km)
        logging.debug(f"📦 Found {len(pois)} POIs")

        if not pois or len(pois) < 2:
            raise HTTPException(status_code=404, detail="Not enough POIs found.")

        return generate_candidate_routes(pois, request.num_routes, request.num_pois)

    except Exception as e:
        logging.exception("❌ Failed to generate routes")
        raise HTTPException(
            status_code=500, detail=f"Failed to generate routes: {str(e)}"
        )


def generate_candidate_routes(
    pois: List[POISchema], num_routes: int, num_pois: int
) -> List[List[POISchema]]:
    all_categories = sorted(set(cat for poi in pois for cat in poi.categories if cat))
    category_map = {cat: [] for cat in all_categories}
    for poi in pois:
        for cat in poi.categories:
            if cat in category_map:
                category_map[cat].append(poi)

    routes = []
    seen_signatures: Set[Tuple[str]] = set()

    for _ in range(num_routes * 4):  # retry buffer
        base = [
            random.choice(category_map[cat])
            for cat in all_categories
            if category_map[cat]
        ]
        remaining_slots = num_pois - len(base)

        if remaining_slots > 0:
            remaining_pois = [p for p in pois if p not in base]
            if len(remaining_pois) < remaining_slots:
                continue
            base += random.sample(remaining_pois, remaining_slots)

        start = random.choice(base)
        ordered = order_pois_by_proximity(start, base)
        perturbed = perturb_route(ordered, p=0.3)

        signature = tuple(poi.id for poi in perturbed)
        if signature not in seen_signatures:
            seen_signatures.add(signature)
            routes.append(perturbed)

        if len(routes) >= num_routes:
            break

    if not routes:
        raise HTTPException(
            status_code=404, detail="Could not generate distinct route options."
        )

    return routes
