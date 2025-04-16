import logging
import requests
import json
import re
from typing import List, Dict
from fastapi import HTTPException
from pathlib import Path
from collections import defaultdict
from config import settings
from schemas.llm_suggestion import LLMPOISuggestion
from services.route_optimizer import haversine_distance
from geopy.distance import geodesic
import random


# Config
OLLAMA_URL = settings.ollama_url
OLLAMA_MODEL = settings.ollama_model
OVERPASS_API_URL = "https://overpass-api.de/api/interpreter"
OSM_TAGS_CACHE_FILE = Path(__file__).parent / "osm_tags_cache.json"

# --- Utilities ---

def load_osm_tag_reference() -> Dict[str, List[str]]:
    try:
        with open(OSM_TAGS_CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"⚠️ Failed to load OSM tags cache: {e}")
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
    for fallback_key in ["location", "place", "road", "addr:place", "addr:neighbourhood"]:
        if fallback := tags.get(fallback_key):
            return fallback

    # Try to infer from brand or name (least reliable)
    if "brand" in tags:
        return f"Near {tags['brand']}"

    return None  # nothing worked

def extract_primary_category(tags: dict, overpass_tags: List[dict]) -> str | None:
    # 1. First try matching LLM tags
    valid_tag_set = {(tag["key"], tag["value"]) for tag in overpass_tags if tag.get("key") and tag.get("value")}
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


# --- Normalization Function ---

def normalize_overpass_tags(overpass_tags: List) -> List[dict]:
    """
    Ensure every tag is a dictionary. If an item is a string, convert it to a dict with a default key.
    """
    normalized = []
    for tag in overpass_tags:
        if isinstance(tag, dict):
            normalized.append(tag)
        elif isinstance(tag, str):
            # You can change the default key if needed; here we assume "amenity" as default.
            normalized.append({"key": "amenity", "value": tag.strip()})
        else:
            continue
    return normalized

# --- LLM tag resolution ---

def get_overpass_tags_from_interests(interests: str) -> list[dict]:
    osm_tags = load_osm_tag_reference()

    prompt = f"""
You are a travel assistant AI. The user will provide their interests (e.g., "music, yoga, art, fashion").

Your task is to analyze the interests and return a JSON array of OpenStreetMap tag objects. Each tag object must include:
- "key": the OSM tag key (e.g., "tourism", "leisure")
- "value": the corresponding tag value (e.g., "museum", "gallery")

Only include tags from this list:
{json.dumps(osm_tags, indent=2)}

Only select tag values that represent places people can visit, explore, or hang out in. For example: museums, galleries, cafes, music venues, etc.

Avoid tags that usually refer to schools, kindergartens, government buildings, or closed institutions, unless they are commonly visited by the public.

Return ONLY a JSON array of objects. Do not include any other text.

User interests: {interests}
""".strip()

    print("🧠 Sending Overpass tag prompt to Ollama:\n", prompt)

    try:
        response = requests.post(
            OLLAMA_URL,
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
            timeout=60
        )
        response.raise_for_status()
        raw_output = response.json().get("response", "")
        print("📥 Ollama Overpass tag response:\n", raw_output)

        match = re.search(r"\[\s*.*?\s*\]", raw_output, re.DOTALL)
        if not match:
            raise ValueError("No JSON array found in LLM response.")
        parsed = json.loads(match.group(0))

        return [
            tag for tag in parsed
            if isinstance(tag, dict) and tag.get("key") and tag.get("value")
        ]

    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Ollama request failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse Overpass tags: {str(e)}")
    
# --- Query Builder ---

def build_overpass_query(overpass_tags: List[dict], lat: float, lon: float, radius_m: int) -> str:
    grouped: Dict[str, List[str]] = defaultdict(list)
    for tag in overpass_tags:
        key, value = tag.get("key"), tag.get("value")
        if key and value:
            grouped[key].append(value)

    filters = []
    for key, values in grouped.items():
        pattern = "|".join(sorted(set(values)))
        filters += [
            f'node["{key}"~"{pattern}"](around:{radius_m},{lat},{lon});',
            f'way["{key}"~"{pattern}"](around:{radius_m},{lat},{lon});',
            f'relation["{key}"~"{pattern}"](around:{radius_m},{lat},{lon});',
        ]

    return f"""
[out:json][timeout:25];
(
  {"\n  ".join(filters)}
);
out center tags;
""".strip()


def deduplicate_pois(pois: List[LLMPOISuggestion], threshold_km: float = 0.4) -> List[LLMPOISuggestion]:
    unique = []
    for poi in pois:
        if any(
            p.name == poi.name and geodesic((p.latitude, p.longitude), (poi.latitude, poi.longitude)).km < threshold_km
            for p in unique
        ):
            continue
        unique.append(poi)
    return unique


# --- Main Entry Point ---

def get_pois_from_overpass(
    location: tuple[float, float],
    overpass_tags: List,
    radius_km: float,
    debug: bool = False
) -> List[LLMPOISuggestion]:
    lat, lon = location
    radius_m = int(radius_km * 1000)

    overpass_tags = normalize_overpass_tags(overpass_tags)
    query = build_overpass_query(overpass_tags, lat, lon, radius_m)
    print("🛰️ Overpass query:\n", query)

    try:
        response = requests.post(OVERPASS_API_URL, data=query)
        response.raise_for_status()
        data = response.json()
        elements = data.get('elements', [])
        print(f"📦 Overpass returned {len(elements)} elements")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Overpass query failed: {str(e)}")

    filtered = filter_pois_missing_data(overpass_tags, debug, elements)
    deduped = deduplicate_pois(filtered)
    print("📊 Final POI count after deduplication:", len(deduped))

    return deduped

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
            categories=[category]
        )

        raw_pois.append(poi)
    return raw_pois

