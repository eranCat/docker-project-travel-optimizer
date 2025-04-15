import requests
import json
from typing import List, Dict
from fastapi import HTTPException
from schemas.llm_suggestion import LLMPOISuggestion
from services.route_optimizer import haversine_distance
from collections import defaultdict, Counter
from pathlib import Path

OVERPASS_API_URL = "https://overpass-api.de/api/interpreter"
OSM_TAGS_CACHE_FILE = Path(__file__).parent / "osm_tags_cache.json"


def load_osm_tag_reference() -> Dict[str, List[str]]:
    try:
        with open(OSM_TAGS_CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"⚠️ Failed to load OSM tags cache: {e}")
        return {}


def extract_address(tags: dict) -> str | None:
    if "addr:full" in tags:
        return tags["addr:full"]

    components = [
        tags.get("addr:street"),
        tags.get("addr:housenumber"),
        tags.get("addr:city")
    ]
    components = [c for c in components if c]
    if components:
        return ", ".join(components)

    return None


def extract_primary_category(tags: dict, overpass_tags: List[dict]) -> str | None:
    valid_tag_set = {(tag["key"], tag["value"]) for tag in overpass_tags if tag.get("key") and tag.get("value")}
    valid_values = {tag["value"] for tag in overpass_tags if tag.get("value")}

    for key, value in tags.items():
        if (key, value) in valid_tag_set:
            return value

    for value in tags.values():
        if value in valid_values:
            return value

    return None


def build_overpass_query(overpass_tags: List[dict], lat: float, lon: float, radius_m: int) -> str:
    grouped_tags: Dict[str, List[str]] = defaultdict(list)

    for tag in overpass_tags:
        key = tag.get("key")
        value = tag.get("value")
        if not key or not value:
            continue
        grouped_tags[key].append(value)

    filters = []
    for key, values in grouped_tags.items():
        unique_values = sorted(set(values))
        pattern = "|".join(unique_values)
        filters.append(f'node["{key}"~"{pattern}"](around:{radius_m},{lat},{lon});')
        filters.append(f'way["{key}"~"{pattern}"](around:{radius_m},{lat},{lon});')
        filters.append(f'relation["{key}"~"{pattern}"](around:{radius_m},{lat},{lon});')

    query = f"""
    [out:json][timeout:60];
    (
      {"\n  ".join(filters)}
    );
    out center tags;
    """.strip()

    return query


def get_pois_from_overpass(
    location: tuple[float, float],
    overpass_tags: List[dict],
    radius_km: float,
    num_results: int,
    debug: bool = False
) -> List[LLMPOISuggestion]:
    lat, lon = location
    radius_m = int(radius_km * 1000)

    overpass_query = build_overpass_query(overpass_tags, lat, lon, radius_m)
    print("🛰️ Overpass query:\n", overpass_query)

    try:
        response = requests.post(OVERPASS_API_URL, data=overpass_query)
        response.raise_for_status()
        data = response.json()
        print(f"📦 Overpass returned {len(data.get('elements', []))} elements")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Overpass query failed: {str(e)}")

    pois = []
    for element in data.get("elements", []):
        tags = element.get("tags", {})
        if not tags:
            continue
        print("🔍 Raw tags:", tags)

        name = tags.get("name")
        if not name:
            if not debug:
                continue
            name = "Unnamed"

        category = extract_primary_category(tags, overpass_tags)
        if not category:
            if not debug:
                continue
            category = "unknown"

        if element.get("type") == "node":
            el_lat = element.get("lat")
            el_lon = element.get("lon")
        else:
            center = element.get("center", {})
            el_lat = center.get("lat")
            el_lon = center.get("lon")

        if not el_lat or not el_lon:
            el_lat = 0
            el_lon = 0
            continue

        address = extract_address(tags)
        if not address:
            if not debug:
                continue
            address = "No address"

        description = (
            tags.get("description")
            or tags.get("note")
            or f"A {category.replace('_', ' ')} in {tags.get('addr:city', 'the area')}"
        )

        poi = LLMPOISuggestion(
            name=name,
            description=description,
            latitude=el_lat,
            longitude=el_lon,
            address=address,
            categories=[category]
        )

        pois.append((poi, haversine_distance((el_lat, el_lon), location)))

    pois.sort(key=lambda x: x[1])
    print("📊 Category breakdown:", Counter(p[0].categories[0] for p in pois if p[0].categories))
    return [p[0] for p in pois[:num_results]]
