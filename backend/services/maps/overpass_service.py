import logging
import json
import requests
from pathlib import Path
from functools import lru_cache
from itertools import groupby
from typing import List, Dict, Optional

from fastapi import APIRouter, HTTPException
from geopy.distance import geodesic

from models.route_request import RouteGenerationRequest
from models.overpass import OverpassElement, OverpassQueryParams, OverpassTag
from models.llm_suggestion import LLMPOISuggestion
from services.maps.geocoding import geocode_location
from services.llm.groq_client import call_groq_for_tags

router = APIRouter()

# Configuration
OVERPASS_API_URL = "https://overpass-api.de/api/interpreter"
OSM_TAGS_CACHE_FILE = Path(__file__).parent / "osm_tags_cache.json"
MIN_TAGS = 3  # minimum tags required from LLM
MAX_TAGS_PER_KEY = 3  # maximum values per key


def load_osm_tag_reference() -> Dict[str, List[str]]:
    try:
        with open(OSM_TAGS_CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logging.error(f"Failed to load OSM tags cache: {e}")
        raise HTTPException(
            status_code=500, detail="OSM tag reference missing or invalid."
        )


def extract_address(tags: dict) -> Optional[str]:
    if "addr:full" in tags:
        return tags["addr:full"]
    parts = []
    for field in ("addr:street", "street", "addr:housenumber", "addr:city"):
        if tags.get(field):
            parts.append(tags[field])
    if parts:
        return ", ".join(parts)
    for key in ("location", "place", "road", "addr:place", "addr:neighbourhood"):
        if tags.get(key):
            return tags[key]
    if "brand" in tags:
        return f"Near {tags['brand']}"
    return None


def extract_primary_category(tags: dict, overpass_tags: List[OverpassTag]) -> str:
    valid_set = {(t.key, t.value) for t in overpass_tags}
    for k, v in tags.items():
        if (k, v) in valid_set:
            return v
    for key in ("amenity", "shop", "tourism", "cuisine", "leisure"):
        if key in tags:
            return tags[key]
    for k, v in tags.items():
        if isinstance(v, str) and k != "name":
            return v
    return "unknown"


def thin_pois_by_min_distance(
    pois: List[LLMPOISuggestion], min_dist_m: float
) -> List[LLMPOISuggestion]:
    """
    Keep only one POI within each min_dist_m radius.
    Iterates greedily: for each POI in the input order,
    adds it to the result if it's >= min_dist_m from all kept.
    """
    kept: List[LLMPOISuggestion] = []
    for poi in pois:
        too_close = False
        for other in kept:
            if (
                geodesic(
                    (poi.latitude, poi.longitude), (other.latitude, other.longitude)
                ).meters
                < min_dist_m
            ):
                too_close = True
                break
        if not too_close:
            kept.append(poi)
    return kept


@lru_cache(maxsize=500)
def get_overpass_tags_from_interests(interests: str) -> List[OverpassTag]:
    valid_ref = load_osm_tag_reference()
    try:
        raw = call_groq_for_tags(interests, valid_ref)
    except Exception as e:
        logging.error(f"LLM tag generation error: {e}")
        raise HTTPException(status_code=502, detail="Tag generation service error.")

    if not isinstance(raw, list) or not raw:
        raise HTTPException(
            status_code=422, detail="No tags generated; please refine interests."
        )

    corrected: List[OverpassTag] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        k = item.get("key")
        v = item.get("value")
        if k and v and k in valid_ref and v in valid_ref[k]:
            corrected.append(OverpassTag(key=k, value=v))
    if len(corrected) < MIN_TAGS:
        raise HTTPException(
            status_code=422,
            detail="Insufficient tags generated; please refine interests.",
        )

    # Prune to max per key
    pruned: List[OverpassTag] = []
    corrected.sort(key=lambda t: t.key)
    for key, grp in groupby(corrected, key=lambda t: t.key):
        lst = list(grp)
        pruned.extend(lst[:MAX_TAGS_PER_KEY])
    return pruned


def get_pois_from_overpass(
    request: RouteGenerationRequest,tags, debug: bool = False
) -> List[LLMPOISuggestion]:
    """
    Fetch, filter, thin and return POIs based on user request.
    """
    # Geocode user location
    lat, lon = geocode_location(request.location)
    # Calculate radius in meters
    radius_m = int(request.radius_km * 1000)
    # Build Overpass query
    qp = OverpassQueryParams(tags=tags, lat=lat, lon=lon, radius_m=radius_m)
    query = qp.to_query()
    logging.debug(f"Overpass query:\n{query}\n")
    # Execute Overpass
    try:
        resp = requests.post(OVERPASS_API_URL, data=query, timeout=15)
        resp.raise_for_status()
        elements = [OverpassElement(**e) for e in resp.json().get("elements", [])]
    except Exception as e:
        logging.error(f"Overpass request failed: {e}")
        raise HTTPException(
            status_code=503, detail="Failed to fetch POIs from Overpass."
        )
    # Parse and filter elements
    pois: List[LLMPOISuggestion] = []
    for el in elements:
        tags_el = el.tags or {}
        name = tags_el.get("name")
        if not name and not debug:
            continue
        category = extract_primary_category(tags_el, tags)
        if not category and not debug:
            continue
        lat_el = el.lat if el.type == "node" else (el.center or {}).get("lat")
        lon_el = el.lon if el.type == "node" else (el.center or {}).get("lon")
        if lat_el is None or lon_el is None:
            continue
        address = extract_address(tags_el)
        if not address or address.startswith("Near "):
            continue
        desc = (
            tags_el.get("description") or tags_el.get("note") or f"{name} - {address}"
        )
        pois.append(
            LLMPOISuggestion(
                id=str(el.id),
                name=name,
                description=desc,
                latitude=lat_el,
                longitude=lon_el,
                address=address,
                categories=[category],
            )
        )
    # Step 2: Greedy thin by minimum spacing
    if request.num_pois > 0:
        min_dist = (request.radius_km * 1000) / request.num_pois
        pois = thin_pois_by_min_distance(pois, min_dist)
        logging.debug(f"After greedy thinning: {len(pois)} POIs")
    return pois
