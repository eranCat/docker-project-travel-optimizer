import requests
import json
import re
from typing import List, Dict
from fastapi import HTTPException
from pathlib import Path
from collections import defaultdict, Counter
from config import settings
from schemas.llm_suggestion import LLMPOISuggestion
from services.route_optimizer import haversine_distance

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

# --- LLM tag resolution ---

def get_overpass_tags_from_interests(interests: str) -> List[dict]:
    osm_tags = load_osm_tag_reference()

    tag_info = "\n".join(
        f'- "{key}": {", ".join(values[:10])}' for key, values in osm_tags.items()
    )

    prompt = f"""
You are a travel assistant AI. The user will provide their interests (e.g., "food, yoga, fashion").
Your task is to return a JSON array of OpenStreetMap-compatible tags (key-value pairs) that can be used with the Overpass API.

Each item in the array must be an object with:
- "key": the OSM tag key (e.g., "amenity", "leisure")
- "value": the corresponding tag value (e.g., "restaurant", "stadium")

Only include tags that are valid according to OpenStreetMap tagging conventions.

You may also infer mappings from user interests to the closest available tags.
Examples:
- "yoga" → "leisure" = "fitness_centre"
- "sports" → "leisure" = "pitch", "sport" = "soccer"
- "fashion" → "shop" = "clothes" or "shop" = "boutique"
- "shopping" → "shop" = "mall", "supermarket", "clothes"

Here are valid OpenStreetMap tag examples you can choose from:
{tag_info}

Respond ONLY with a JSON array of key-value objects.

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
        data = response.json()
        raw_output = data.get("response", "")
        print("📥 Ollama Overpass tag response:\n", raw_output)

        match = re.search(r"\[\s*.*?\s*\]", raw_output, re.DOTALL)
        if not match:
            raise ValueError("No JSON array found in LLM response.")
        parsed = json.loads(match.group(0))

        print("🔍 Parsed Overpass tags:\n", parsed)
        return [tag for tag in parsed if isinstance(tag, dict) and tag.get("key") and tag.get("value")]

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

# --- Main Entry Point ---

def get_pois_from_overpass(
    location: tuple[float, float],
    overpass_tags: List[dict],
    radius_km: float,
    num_results: int,
    debug: bool = False
) -> List[LLMPOISuggestion]:
    lat, lon = location
    radius_m = int(radius_km * 1000)

    query = build_overpass_query(overpass_tags, lat, lon, radius_m)
    print("🛰️ Overpass query:\n", query)

    try:
        response = requests.post(OVERPASS_API_URL, data=query)
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

    pois.sort(key=lambda x: (x[0].categories[0] if x[0].categories else "", x[1]))
    print("📊 Category breakdown:", Counter(p[0].categories[0] for p in pois if p[0].categories))
    return [p[0] for p in pois[:num_results]]
