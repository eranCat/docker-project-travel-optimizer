from functools import lru_cache
import logging
import requests
import json
from typing import List, Dict
from fastapi import HTTPException
from pathlib import Path
from services.maps.geocoding import geocode_location
from models.route_request import RouteGenerationRequest
from services.llm.groq_client import call_groq_for_tags
from models.overpass import OverpassElement, OverpassQueryParams, OverpassTag
from models.llm_suggestion import LLMPOISuggestion
from geopy.distance import geodesic

# Config
OVERPASS_API_URL = "https://overpass-api.de/api/interpreter"
OSM_TAGS_CACHE_FILE = Path(__file__).parent / "osm_tags_cache.json"

GENERAL_FALLBACK_TAGS = [
    OverpassTag(key="amenity", value="restaurant"),
    OverpassTag(key="amenity", value="cafe"),
    OverpassTag(key="amenity", value="marketplace"),
    OverpassTag(key="tourism", value="attraction"),
    OverpassTag(key="tourism", value="museum"),
    OverpassTag(key="leisure", value="park"),
    OverpassTag(key="leisure", value="garden"),
    OverpassTag(key="shop", value="supermarket"),
    OverpassTag(key="shop", value="convenience"),
]

def load_osm_tag_reference() -> Dict[str, List[str]]:
    try:
        with open(OSM_TAGS_CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logging.debug(f"⚠️ Failed to load OSM tags cache: {e}")
        return {}


def extract_address(tags: dict) -> str | None:
    # Prefer full address if available
    if "addr:full" in tags:
        return tags["addr:full"]

    # Build address from parts
    parts = []
    street = tags.get("addr:street") or tags.get("street")
    house = tags.get("addr:housenumber")
    city = tags.get("addr:city")

    if street:
        parts.append(street)
    if house:
        parts.append(house)
    if city:
        parts.append(city)

    if parts:
        return ", ".join(parts)

    # Try fallback fields
    for fallback_key in [
        "location",
        "place",
        "road",
        "addr:place",
        "addr:neighbourhood",
    ]:
        if fallback := tags.get(fallback_key):
            return fallback

    # Try to infer from brand or name (least reliable)
    if "brand" in tags:
        return f"Near {tags['brand']}"

    return None  # nothing worked


def extract_primary_category(tags: dict, overpass_tags: List[dict]) -> str | None:
    # 1. First try matching LLM tags
    valid_tag_set = {
        (tag.key, tag.value) for tag in overpass_tags if tag.key and tag.value
    }
    for key, value in tags.items():
        if (key, value) in valid_tag_set:
            return value

    # 2. Fallback: return the first "interesting" tag as category
    priority_keys = ["amenity", "shop", "tourism", "cuisine", "leisure"]
    for key in priority_keys:
        if key in tags:
            return tags[key]

    # 3. Final fallback
    for key, value in tags.items():
        if isinstance(value, str) and key != "name":
            return value

    return "unknown"


# --- LLM tag resolution ---
@lru_cache(maxsize=500)
def get_overpass_tags_from_interests(interests: str) -> list[OverpassTag]:
    # Step 1: Call Groq
    validTags = load_osm_tag_reference()
    tags_raw = call_groq_for_tags(interests, validTags)

    if not tags_raw:
        raise ValueError("LLM returned no tags")

    corrected_tags = []

    if tags_raw:
            for tag_dict in tags_raw:
                key = tag_dict.get("key")
                value = tag_dict.get("value")

                if not key or not value:
                    continue

                # Fix known hallucination mistakes
                # if key == "market" and value == "marketplace":
                #     corrected_tags.append(OverpassTag(key="amenity", value="marketplace"))
                # else:
                #     corrected_tags.append(OverpassTag(key=key, value=value))

    # If nothing good found, fallback
    if not corrected_tags:
        logging.warning("⚠️ Groq returned invalid or no tags. Using general fallback categories.")
        return GENERAL_FALLBACK_TAGS

    # Optional: if corrected_tags are too rare (only 1 tag?), fallback
    if len(corrected_tags) < 2:
        logging.warning("⚠️ Very few tags found. Using general fallback categories.")
        return GENERAL_FALLBACK_TAGS

    return corrected_tags

# --- Main Entry Point ---


def get_pois_from_overpass(
    request:RouteGenerationRequest,
    debug: bool = False,
) -> List[LLMPOISuggestion]:

    lat, lon = geocode_location(request.location)
    interests = request.interests
    radius_m = int(request.radius_km * 1000)

    # 🌟 Step 1: Get Overpass tags automatically from interests
    overpass_tags = get_overpass_tags_from_interests(interests)

    if not overpass_tags:
        raise HTTPException(
            status_code=400, detail="No valid tags generated from interests."
        )

    query_params = OverpassQueryParams(
        tags=overpass_tags, lat=lat, lon=lon, radius_m=radius_m
    )

    logging.debug(f"🔎 Looking for tags: {overpass_tags}")

    query = query_params.to_query()
    logging.debug(f"🛰️ Overpass query:\n{query}\n")

    try:
        response = requests.post(OVERPASS_API_URL, data=query)
        response.raise_for_status()
        data = response.json()
        raw_elements = data.get("elements", [])
        logging.debug(f"📦 Overpass returned {len(raw_elements)} elements")

        # 🌟 Step 2: Parse to structured OverpassElements
        elements = [OverpassElement(**e) for e in raw_elements]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Overpass query failed: {str(e)}")

    # 🌟 Step 2: Filter invalid elements
    filtered = filter_pois_missing_data(overpass_tags, debug, elements)

    logging.debug(f"📊 Final POI count : {len(filtered)}")

    # 🌟 Step 3: Order POIs by proximity
    ordered_pois = order_pois_by_proximity(filtered)

    return ordered_pois


def filter_pois_missing_data(
    overpass_tags: List[OverpassTag], debug: bool, elements: List[OverpassElement]
) -> List[LLMPOISuggestion]:

    raw_pois = []
    for element in elements:
        tags = element.tags
        if not tags:
            continue

        name = tags.get("name")
        if not name and not debug:
            continue

        category = extract_primary_category(tags, overpass_tags)
        if not category and not debug:
            continue

        if element.type == "node":
            el_lat = element.lat
            el_lon = element.lon
        else:
            center = element.center or {}
            el_lat = center.get("lat")
            el_lon = center.get("lon")

        if not el_lat or not el_lon:
            continue

        address = extract_address(tags)
        if not address or address.startswith("Near "):
            continue

        description = tags.get("description") or tags.get("note")
        if not description or "unknown" in description.lower():
            description = f"{name} - {address}"

        poi = LLMPOISuggestion(
            id=str(element.id or 0),
            name=name or "Unnamed",
            description=description,
            latitude=el_lat,
            longitude=el_lon,
            address=address,
            categories=[category],
        )

        raw_pois.append(poi)
    return raw_pois


def order_pois_by_proximity(pois: list) -> list:
    if not pois:
        return []

    remaining = pois[:]
    ordered = []

    # Start from the first POI (can improve later if needed)
    current = remaining.pop(0)
    ordered.append(current)

    while remaining:
        next_poi = min(
            remaining,
            key=lambda p: geodesic(
                (current.latitude, current.longitude), (p.latitude, p.longitude)
            ).meters,
        )
        ordered.append(next_poi)
        remaining.remove(next_poi)
        current = next_poi

    return ordered


# End of file
