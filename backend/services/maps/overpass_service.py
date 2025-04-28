from functools import lru_cache
import logging
import openai
import requests
import json
from typing import List, Dict, Tuple
from fastapi import HTTPException
from pathlib import Path
from services.llm.groq_client import call_groq_for_tags
from schemas.overpass import OverpassQueryParams, OverpassTag
from config import settings
from schemas.llm_suggestion import LLMPOISuggestion
from geopy.distance import geodesic

# Config
OVERPASS_API_URL = "https://overpass-api.de/api/interpreter"
OSM_TAGS_CACHE_FILE = Path(__file__).parent / "osm_tags_cache.json"

# --- Utilities ---


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
@lru_cache(maxsize=200)
def get_overpass_tags_from_interests(user_interests: str) -> list[dict]:
    valid_tags = load_osm_tag_reference()
    return call_groq_for_tags(user_interests, valid_tags)

def deduplicate_pois(
    pois: List[LLMPOISuggestion], threshold_km: float = 0.4
) -> List[LLMPOISuggestion]:
    unique = []
    for poi in pois:
        if any(
            p.name == poi.name
            and geodesic((p.latitude, p.longitude), (poi.latitude, poi.longitude)).km
            < threshold_km
            for p in unique
        ):
            continue
        unique.append(poi)
    return unique


# --- Main Entry Point ---


def get_pois_from_overpass(
    location: Tuple[float, float],
    overpass_tags: List[OverpassTag],
    radius_km: float,
    debug: bool = False,
) -> List[LLMPOISuggestion]:

    lat, lon = location
    radius_m = int(radius_km * 1000)

    query_params = OverpassQueryParams(
        tags=overpass_tags, lat=lat, lon=lon, radius_m=radius_m
    )

    logging.debug(f"looking for : {overpass_tags}")

    query = query_params.to_query()
    logging.debug(f"🛰️ Overpass query:\n{query}\n")

    try:
        response = requests.post(OVERPASS_API_URL, data=query)
        response.raise_for_status()
        data = response.json()
        elements = data.get("elements", [])
        logging.debug(f"📦 Overpass returned {len(elements)} elements")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Overpass query failed: {str(e)}")

    filtered = filter_pois_missing_data(overpass_tags, debug, elements)
    deduped = deduplicate_pois(filtered)
    logging.debug(f"📊 Final POI count after deduplication: {len(deduped)}")

    ordered_pois = order_pois_by_proximity(deduped)

    return ordered_pois


def filter_pois_missing_data(overpass_tags, debug, elements):
    raw_pois = []
    for element in elements:
        tags = element.get("tags", {})
        if not tags:
            continue

        name = tags.get("name")
        if not name and not debug:
            continue

        category = extract_primary_category(tags, overpass_tags)
        if not category and not debug:
            continue

        if element.get("type") == "node":
            el_lat = element.get("lat")
            el_lon = element.get("lon")
        else:
            center = element.get("center", {})
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
            id=str(element.get("id", 0)),
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
