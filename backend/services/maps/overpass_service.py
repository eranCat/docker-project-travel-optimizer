import asyncio
import logging
import json
import math
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import requests
from functools import lru_cache
from itertools import groupby
from typing import List, Dict, Optional, Tuple

from fastapi import HTTPException
from geopy.distance import geodesic

from models.route_request import RouteGenerationRequest
from models.overpass import OverpassElement, OverpassQueryParams, OverpassTag
from models.llm_suggestion import LLMPOISuggestion

from services.maps.geocoding import geocode_location
from services.llm.groq_client import call_groq_for_tags
from config import settings

# Category values that are not tourist destinations (errands, infrastructure, etc.)
NON_TOURIST_CATEGORIES = {
    "supermarket", "convenience", "fast_food", "pharmacy", "hospital", "clinic",
    "doctor", "dentist", "bank", "atm", "post_office", "police", "fire_station",
    "fuel", "parking", "car_wash", "laundry", "dry_cleaning", "storage",
    "office", "government", "residential", "commercial", "industrial", "retail",
    "motorway", "trunk", "primary", "secondary", "tertiary", "residential",
    "service", "footway", "cycleway", "path", "steps", "platform", "station",
    "halt", "tram_stop", "subway_entrance", "fence", "wall", "gate", "bollard",
    "generator", "power", "telecom", "mast", "drain", "ditch", "farmland",
    # NOTE: "place_of_worship" intentionally NOT blocked — it's only ever fetched
    # when the user's interests explicitly map to it (churches/mosques/temples),
    # so blocking it would silently drop exactly what they asked for.
    "cemetery", "grave_yard", "kiosk", "butcher", "shoes",
    "clothes", "alcohol", "cannabis", "beverages", "electrician", "carpenter",
    "shoemaker", "tailor",
}

# Hard-block by raw OSM tag key/value — catches elements that carry a tourist tag
# (e.g. tourism=attraction) alongside a non-tourist landuse/amenity tag. Primary
# category extraction would pick "attraction" and skip the NON_TOURIST_CATEGORIES
# check, so we must test the full tag dict before resolving the primary category.
NON_TOURIST_TAG_PAIRS: set[tuple[str, str]] = {
    ("landuse", "cemetery"),
    ("amenity", "grave_yard"),
    ("amenity", "cemetery"),
    ("landuse", "grave_yard"),
    ("historic", "tomb"),
    ("historic", "grave"),
    ("historic", "wayside_shrine"),
}

# Name-pattern block: catches elements only tagged tourism=attraction whose
# true nature (cemetery, shelter, infrastructure) is visible in the name.
_NON_TOURIST_NAME_SUBSTRINGS = frozenset({
    "קברות", "בית קברות", "cemetery", "graveyard",
    "מצבה", "مقبرة", "جبانة",
    "bomb shelter", "מרחב מוגן", "ממ\"ד", "ממד",
    "sewage", "wastewater", "power station", "transformer",
})

# Global fast-food / retail chains that slip through OSM's amenity=restaurant tag
# (because they're sit-down, not fast_food). Never tourist destinations.
_CHAIN_BRANDS = frozenset({
    "pizza hut", "mcdonald's", "mcdonalds", "kfc", "burger king", "subway",
    "domino's", "dominos", "papa john's", "little caesars",
    "taco bell", "wendy's", "wendys", "popeyes", "chick-fil-a",
    "five guys", "shake shack", "chipotle", "hardee's", "carl's jr",
    "starbucks", "dunkin", "dunkin' donuts", "tim hortons", "costa coffee",
    "cafe nero", "pret a manger", "greggs",
    "ikea", "h&m", "zara", "uniqlo", "gap", "old navy",
    "walmart", "target", "costco", "home depot",
    "7-eleven", "am pm",
})

def _name_is_blocked(name: str) -> bool:
    lower = name.lower()
    return any(sub in lower for sub in _NON_TOURIST_NAME_SUBSTRINGS)

def _is_chain_brand(tags_el: dict) -> bool:
    """Return True if the element is a well-known non-tourist chain brand."""
    brand = (tags_el.get("brand") or "").lower()
    name  = (tags_el.get("name")  or "").lower()
    return brand in _CHAIN_BRANDS or name in _CHAIN_BRANDS


_CLOSED_TAG_PREFIXES = ("disused:", "abandoned:", "demolished:", "removed:", "was:")

def _is_permanently_closed(tags_el: dict) -> bool:
    """Return True if OSM tags indicate the place is permanently closed.
    Note: only catches closures that OSM contributors have already tagged.
    Stale OSM data for real-world closed places cannot be detected here.
    """
    if tags_el.get("opening_hours") == "off":
        return True
    if tags_el.get("closed") in ("yes", "true"):
        return True
    if tags_el.get("disused") in ("yes", "true") or tags_el.get("abandoned") in ("yes", "true"):
        return True
    if tags_el.get("shop") == "vacant" or tags_el.get("amenity") == "vacant":
        return True
    if tags_el.get("operational_status") in ("closed", "disused", "abandoned"):
        return True
    if tags_el.get("end_date"):
        return True
    # disused:amenity, abandoned:shop, etc.
    if any(k.startswith(_CLOSED_TAG_PREFIXES) for k in tags_el):
        return True
    return False

# Broad fallback tags added when main query yields < 3 distinct categories.
# Generic tourist POIs that complement almost any route interest.
_SUPPLEMENTARY_TAGS = [
    OverpassTag(key="tourism", value="museum"),
    OverpassTag(key="tourism", value="viewpoint"),
    OverpassTag(key="historic", value="monument"),
]

# Configuration
OVERPASS_MIRRORS = [
    settings.overpass_api_url,
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://z.overpass-api.de/api/interpreter",
]
MIN_TAGS = 2  # minimum tags required from LLM
MAX_TAGS_PER_KEY = 4  # maximum values per key
OSM_TAGS_CACHE_FILE = Path(__file__).parent / "osm_tags_cache.json"
POI_CACHE_FILE = Path(__file__).parent.parent.parent / "cache" / "poi_cache.json"

# Rate limiting
_last_overpass_request_time = 0
MIN_REQUEST_INTERVAL = 1.0  # Minimum seconds between Overpass requests

# POI cache (TTL-based) — speeds up repeat searches with the same inputs.
# Empty results are NOT cached, so a transient Overpass failure doesn't pin
# zero POIs in memory. Max entries keeps memory bounded.
POI_CACHE_TTL = 1800  # seconds (30 minutes) — OSM data stable enough for this
POI_CACHE_MAX = 64
_poi_cache: dict = {}  # key -> (expires_at, list[LLMPOISuggestion])


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


def quality_score(tags_el: dict) -> int:
    """
    Heuristic quality score for an OSM element. Higher = better-documented
    place, more likely to be worth visiting. Used to prefer well-tagged POIs
    when two candidates collide during de-duplication.
    """
    score = 0
    # Well-known places almost always have these
    if tags_el.get("wikidata"):
        score += 5
    if tags_el.get("wikipedia"):
        score += 4
    if tags_el.get("website") or tags_el.get("contact:website"):
        score += 2
    if tags_el.get("phone") or tags_el.get("contact:phone"):
        score += 1
    if tags_el.get("opening_hours"):
        score += 1
    if tags_el.get("description") or tags_el.get("note"):
        score += 2
    # Localized names suggest tourist relevance
    if any(k.startswith("name:") for k in tags_el):
        score += 1
    # Has a street address
    if tags_el.get("addr:street") or tags_el.get("addr:housenumber"):
        score += 1
    # Penalize anonymous chains slightly (still kept, just deprioritized on ties)
    if tags_el.get("brand") and not tags_el.get("wikidata"):
        score -= 1
    return score


def _corridor_bbox(
    a: Tuple[float, float], b: Tuple[float, float], pad_m: float
) -> Tuple[float, float, float, float]:
    """Bounding box (south, west, north, east) spanning A and B, padded by
    pad_m metres on every side so corridor POIs near the endpoints are included.
    """
    lat_pad = pad_m / 111_320.0
    mean_lat = math.radians((a[0] + b[0]) / 2.0)
    lon_pad = pad_m / (111_320.0 * max(math.cos(mean_lat), 0.01))
    south = min(a[0], b[0]) - lat_pad
    north = max(a[0], b[0]) + lat_pad
    west = min(a[1], b[1]) - lon_pad
    east = max(a[1], b[1]) + lon_pad
    return (south, west, north, east)


def _point_to_segment_dist_m(
    p: Tuple[float, float], a: Tuple[float, float], b: Tuple[float, float]
) -> float:
    """Perpendicular distance (metres) from point p to segment a→b, via a local
    equirectangular projection. Accurate enough for city/region corridor widths.
    """
    mean_lat = math.radians((a[0] + b[0]) / 2.0)
    mx = 111_320.0 * math.cos(mean_lat)  # metres per degree lon
    my = 111_320.0                       # metres per degree lat

    ax, ay = a[1] * mx, a[0] * my
    bx, by = b[1] * mx, b[0] * my
    px, py = p[1] * mx, p[0] * my

    dx, dy = bx - ax, by - ay
    seg_len_sq = dx * dx + dy * dy
    if seg_len_sq == 0:
        return math.hypot(px - ax, py - ay)
    t = ((px - ax) * dx + (py - ay) * dy) / seg_len_sq
    t = max(0.0, min(1.0, t))
    proj_x, proj_y = ax + t * dx, ay + t * dy
    return math.hypot(px - proj_x, py - proj_y)


def _normalize_name(name: str) -> str:
    return re.sub(r'[\s\-_]+', ' ', name.strip().lower())


def thin_pois_by_name(pois: List[LLMPOISuggestion]) -> List[LLMPOISuggestion]:
    """Drop duplicate POIs whose names match after normalization.
    Input must be sorted by quality score (highest first) so the best
    variant wins when two names collide.
    """
    seen: set[str] = set()
    kept: List[LLMPOISuggestion] = []
    for poi in pois:
        key = _normalize_name(poi.name)
        if key not in seen:
            seen.add(key)
            kept.append(poi)
    return kept


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
def get_overpass_tags_from_interests(interests: str, time_of_day: Optional[str] = None) -> List[OverpassTag]:
    valid_ref = load_osm_tag_reference()
    try:
        raw = call_groq_for_tags(interests, valid_ref, time_of_day=time_of_day)
    except Exception as e:
        logging.error(f"LLM tag generation error: {e}. Using fallback tags.")
        # Broad fallback covering the main tourist categories. Used only when
        # the LLM is unreachable — the address filter and quality scoring will
        # still narrow this down to a useful POI set.
        raw = [
            {"key": "tourism", "value": "attraction"},
            {"key": "tourism", "value": "museum"},
            {"key": "tourism", "value": "gallery"},
            {"key": "tourism", "value": "viewpoint"},
            {"key": "historic", "value": "monument"},
            {"key": "historic", "value": "castle"},
            {"key": "historic", "value": "ruins"},
            {"key": "amenity", "value": "restaurant"},
            {"key": "amenity", "value": "cafe"},
            {"key": "leisure", "value": "park"},
        ]

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


def _fetch_from_mirror(mirror_url: str, query: str) -> List[OverpassElement]:
    """Try one Overpass mirror. Raises on any failure."""
    resp = requests.post(
        mirror_url,
        data=query.encode("utf-8"),
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "TravelOptimizer/1.0",
        },
        timeout=(5, 20),
    )
    if resp.status_code == 429:
        time.sleep(2)
        raise RuntimeError(f"rate limited (429)")
    resp.raise_for_status()
    body = resp.json()
    remark = body.get("remark", "")
    if remark and ("error" in remark.lower() or "timeout" in remark.lower()):
        raise RuntimeError(f"Overpass server error: {remark}")
    return [OverpassElement(**e) for e in body.get("elements", [])]


def _fetch_overpass_elements(query: str) -> List[OverpassElement]:
    """Blocking Overpass fetch with rate limiting and parallel mirror racing.

    Fires first 2 mirrors concurrently; takes whichever responds first.
    Falls back to remaining mirrors sequentially if both fail.
    Runs in a thread (via run_in_executor) — uses synchronous requests/sleep.
    """
    global _last_overpass_request_time

    current_time = time.time()
    time_since_last = current_time - _last_overpass_request_time
    if time_since_last < MIN_REQUEST_INTERVAL:
        sleep_time = MIN_REQUEST_INTERVAL - time_since_last
        logging.debug(f"Rate limiting: sleeping {sleep_time:.2f}s before Overpass request")
        time.sleep(sleep_time)

    seen_urls: set = set()
    mirrors = [u for u in OVERPASS_MIRRORS if not (u in seen_urls or seen_urls.add(u))]  # type: ignore[func-returns-value]
    last_error = "Unknown error"

    # Race first 2 mirrors in parallel — take whichever responds first.
    # The loser thread completes in the background (HTTP can't be cancelled).
    parallel, sequential = mirrors[:2], mirrors[2:]
    ex = ThreadPoolExecutor(max_workers=len(parallel))
    try:
        futures = {ex.submit(_fetch_from_mirror, url, query): url for url in parallel}
        for fut in as_completed(futures):
            url = futures[fut]
            try:
                elements = fut.result()
                _last_overpass_request_time = time.time()
                logging.info(f"Overpass success via {url} (parallel race)")
                return elements
            except Exception as e:
                logging.warning(f"Overpass {url} failed: {e}, trying next")
                last_error = str(e)
    finally:
        ex.shutdown(wait=False)

    # Both parallel mirrors failed — try remaining mirrors sequentially
    for url in sequential:
        try:
            elements = _fetch_from_mirror(url, query)
            _last_overpass_request_time = time.time()
            logging.info(f"Overpass success via {url} (sequential fallback)")
            return elements
        except Exception as e:
            logging.warning(f"Overpass {url} failed: {e}, trying next")
            last_error = str(e)

    logging.error(f"All Overpass mirrors failed. Last error: {last_error}")
    raise HTTPException(
        status_code=503,
        detail="POI lookup is temporarily unavailable (all Overpass mirrors failed). Please try again in a minute.",
    )


async def get_pois_from_overpass(
    request: RouteGenerationRequest, tags: tuple[OverpassTag, ...], debug: bool = False
) -> List[LLMPOISuggestion]:
    """
    Fetch, filter, thin and return POIs based on user request.
    Results are cached for POI_CACHE_TTL seconds. Empty results are not cached.
    """
    # TTL cache lookup
    cache_key = (
        request.location, request.radius_km, request.num_pois, tags,
        request.dest_latitude, request.dest_longitude, request.lang,
    )
    now = time.time()
    cached = _poi_cache.get(cache_key)
    if cached and cached[0] > now:
        logging.debug(f"POI cache HIT for {cache_key[:3]} ({len(cached[1])} POIs)")
        return cached[1]
    if cached:
        # Expired entry — drop it
        _poi_cache.pop(cache_key, None)

    # Skip geocoding if lat/lon already provided; otherwise geocode
    if request.latitude is not None and request.longitude is not None:
        lat, lon = request.latitude, request.longitude
        logging.debug(f"Using pre-geocoded coords: ({lat}, {lon})")
    else:
        lat, lon = await geocode_location(request.location)
    # Calculate radius in meters
    radius_m = int(request.radius_km * 1000)

    # A→B mode: query the bounding box spanning both endpoints (padded by the
    # corridor half-width). POIs are filtered to the corridor below.
    if request.is_point_to_point:
        if request.dest_latitude is not None and request.dest_longitude is not None:
            dest_lat, dest_lon = request.dest_latitude, request.dest_longitude
        else:
            dest_lat, dest_lon = await geocode_location(request.dest_location or "")
        bbox = _corridor_bbox((lat, lon), (dest_lat, dest_lon), pad_m=radius_m)
        qp = OverpassQueryParams(
            tags=list(tags), lat=lat, lon=lon, radius_m=radius_m,
            bbox=bbox,
        )
    else:
        dest_lat = dest_lon = None
        qp = OverpassQueryParams(tags=list(tags), lat=lat, lon=lon, radius_m=radius_m)
    query = qp.to_query()
    logging.debug(f"Overpass query:\n{query}\n")

    # Blocking HTTP + sleeps run in a thread so the event loop stays responsive.
    elements = await asyncio.get_running_loop().run_in_executor(
        None, _fetch_overpass_elements, query
    )
    # Filter elements by interests in description and matching tags.
    # We collect (score, poi) tuples so we can prefer well-tagged POIs during
    # the de-duplication thinning pass below.
    scored: List[tuple[int, LLMPOISuggestion]] = []
    drop_counts = {
        "no_name": 0, "no_category": 0, "no_coords": 0,
        "no_tag_match": 0, "non_tourist": 0, "closed": 0,
    }
    logging.info(f"Overpass returned {len(elements)} raw elements")
    for el in elements:
        tags_el = el.tags or {}
        name = tags_el.get("name")
        if not name:
            drop_counts["no_name"] += 1
            continue
        category = extract_primary_category(tags_el, list(tags))
        if not category:
            drop_counts["no_category"] += 1
            continue
        lat_el = el.lat if el.type == "node" else (el.center or {}).get("lat")
        lon_el = el.lon if el.type == "node" else (el.center or {}).get("lon")
        if lat_el is None or lon_el is None:
            drop_counts["no_coords"] += 1
            continue
        # Overpass `around:` matches if any node of a way/relation is within the
        # radius — the extracted center can lie outside. Drop those.
        if qp.bbox is None and geodesic((lat, lon), (lat_el, lon_el)).meters > radius_m:
            drop_counts["out_of_radius"] = drop_counts.get("out_of_radius", 0) + 1
            continue
        # Address is optional — many tourist POIs (parks, viewpoints, castles,
        # natural landmarks) have no street address. Keep them if they have a
        # name and coordinates; drop only the low-quality "Near {brand}" fallback.
        address = extract_address(tags_el)
        if address and address.startswith("Near "):
            address = None
        desc = tags_el.get("description") or tags_el.get("note") or None

        # Hard-block: reject by raw OSM tag pairs or by name pattern.
        if any(tags_el.get(k) == v for k, v in NON_TOURIST_TAG_PAIRS) or _name_is_blocked(name):
            drop_counts["non_tourist"] += 1
            continue

        # Drop permanently closed places.
        if _is_permanently_closed(tags_el):
            drop_counts["closed"] += 1
            continue

        # Drop well-known non-tourist chain brands (e.g. Pizza Hut, McDonald's)
        # that OSM tags as amenity=restaurant, bypassing the fast_food block.
        if _is_chain_brand(tags_el):
            drop_counts["non_tourist"] += 1
            continue

        # Check if tags match
        if not any(tag.key in tags_el and tags_el[tag.key] == tag.value for tag in tags):
            drop_counts["no_tag_match"] += 1
            continue

        # Skip non-tourist / errand categories
        if category in NON_TOURIST_CATEGORIES:
            drop_counts["non_tourist"] += 1
            continue

        opening_hours = tags_el.get("opening_hours") or None
        wheelchair_val = tags_el.get("wheelchair")
        wheelchair_accessible = wheelchair_val in ("yes", "limited") if wheelchair_val else None

        name_he = tags_el.get("name:he") or None

        wiki_tag = tags_el.get("wikipedia")
        wiki_title: Optional[str] = None
        if wiki_tag:
            wiki_title = wiki_tag if ":" in wiki_tag else f"en:{wiki_tag}"

        wikidata_id: Optional[str] = None
        wd_tag = tags_el.get("wikidata")
        if wd_tag and wd_tag.startswith("Q"):
            wikidata_id = wd_tag

        scored.append((
            quality_score(tags_el),
            LLMPOISuggestion(
                id=str(el.id),
                name=name,
                name_he=name_he,
                description=desc,
                latitude=lat_el,
                longitude=lon_el,
                address=address,
                categories=[category],
                opening_hours=opening_hours,
                wheelchair_accessible=wheelchair_accessible,
                wiki_title=wiki_title,
                wikidata_id=wikidata_id,
                osm_type=el.type,
            ),
        ))

    logging.info(
        f"POI filter: {len(elements)} elements -> {len(scored)} POIs. "
        f"Drops: {drop_counts}"
    )

    # Sort by quality score, descending. Thinning iterates in this order so
    # the highest-quality POI in any cluster wins de-duplication ties.
    scored.sort(key=lambda x: x[0], reverse=True)
    pois = [poi for _score, poi in scored]

    # A→B mode: keep only POIs within radius_m of the straight A→B segment, so
    # results lie "on the way" rather than anywhere in the bounding box.
    if request.is_point_to_point and dest_lat is not None and dest_lon is not None:
        a, b = (lat, lon), (dest_lat, dest_lon)
        before_corridor = len(pois)
        pois = [
            p for p in pois
            if _point_to_segment_dist_m((p.latitude, p.longitude), a, b) <= radius_m
        ]
        logging.info(f"Corridor filter ({radius_m}m): {before_corridor} -> {len(pois)} POIs")

    before_name = len(pois)
    pois = thin_pois_by_name(pois)
    if len(pois) < before_name:
        logging.debug(f"Name dedup: {before_name} -> {len(pois)} POIs")

    # Step 2: Light de-duplication only — keep a big candidate pool so the
    # route builder has real choices. Spacing along routes is the route
    # builder's job, not the candidate filter's.
    # Use ~75m in dense city searches, scaling up gently with radius.
    if request.num_pois > 0 and pois:
        min_dist = max(50.0, min(250.0, request.radius_km * 15.0))
        before = len(pois)
        pois = thin_pois_by_min_distance(pois, min_dist)
        logging.debug(
            f"De-duplication ({min_dist:.0f}m): {before} -> {len(pois)} POIs"
        )

    # Category starvation fallback: if < 3 distinct categories found, supplement
    # with broad tourist POIs so the route builder has more categories to work
    # with. Supplementary POIs are appended after main results (lower priority).
    distinct_cats = {cat for p in pois for cat in p.categories}
    if len(pois) < 6 and not request.is_point_to_point:
        logging.info(
            f"Category starvation ({len(distinct_cats)} distinct cats) — "
            "running supplementary broad-tag query"
        )
        supp_qp = OverpassQueryParams(
            tags=_SUPPLEMENTARY_TAGS, lat=lat, lon=lon, radius_m=radius_m,
        )
        try:
            supp_elements = await asyncio.get_running_loop().run_in_executor(
                None, _fetch_overpass_elements, supp_qp.to_query()
            )
            existing_names = {_normalize_name(p.name) for p in pois}
            supp_scored: List[tuple[int, LLMPOISuggestion]] = []
            for el in supp_elements:
                tags_el = el.tags or {}
                name = tags_el.get("name")
                if not name or _normalize_name(name) in existing_names:
                    continue
                category = extract_primary_category(tags_el, _SUPPLEMENTARY_TAGS)
                if not category or category in NON_TOURIST_CATEGORIES:
                    continue
                lat_el = el.lat if el.type == "node" else (el.center or {}).get("lat")
                lon_el = el.lon if el.type == "node" else (el.center or {}).get("lon")
                if lat_el is None or lon_el is None:
                    continue
                if any(tags_el.get(k) == v for k, v in NON_TOURIST_TAG_PAIRS) or _name_is_blocked(name):
                    continue
                if _is_permanently_closed(tags_el) or _is_chain_brand(tags_el):
                    continue
                wiki_tag = tags_el.get("wikipedia")
                wiki_title = (wiki_tag if ":" in wiki_tag else f"en:{wiki_tag}") if wiki_tag else None
                wd_tag = tags_el.get("wikidata")
                wikidata_id = wd_tag if (wd_tag and wd_tag.startswith("Q")) else None
                supp_scored.append((
                    quality_score(tags_el),
                    LLMPOISuggestion(
                        id=str(el.id), name=name,
                        name_he=tags_el.get("name:he") or None,
                        description=tags_el.get("description") or tags_el.get("note") or None,
                        latitude=lat_el, longitude=lon_el,
                        address=extract_address(tags_el) or None,
                        categories=[category],
                        opening_hours=tags_el.get("opening_hours") or None,
                        wheelchair_accessible=(lambda w: w in ("yes", "limited") if w else None)(tags_el.get("wheelchair")),
                        wiki_title=wiki_title, wikidata_id=wikidata_id,
                        osm_type=el.type,
                    ),
                ))
            supp_scored.sort(key=lambda x: x[0], reverse=True)
            supp_pois = [p for _, p in supp_scored]
            supp_pois = thin_pois_by_name(supp_pois)
            if supp_pois:
                pois = pois + supp_pois
                logging.info(f"Supplementary query added {len(supp_pois)} POIs → {len(pois)} total")
        except Exception as e:
            logging.warning(f"Supplementary fallback query failed: {e}")

    # Cache non-empty results
    if pois:
        if len(_poi_cache) >= POI_CACHE_MAX:
            # Evict the oldest entry (smallest expires_at)
            oldest_key = min(_poi_cache, key=lambda k: _poi_cache[k][0])
            _poi_cache.pop(oldest_key, None)
        _poi_cache[cache_key] = (now + POI_CACHE_TTL, pois)
        logging.debug(f"POI cache STORE for {cache_key[:3]} ({len(pois)} POIs)")

    return pois


def save_poi_cache() -> None:
    """Persist the in-memory POI cache to disk so it survives restarts."""
    try:
        POI_CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
        now = time.time()
        entries = []
        for key, (expires_at, pois) in _poi_cache.items():
            if expires_at <= now:
                continue  # skip already-expired entries
            location, radius_km, num_pois, tags, dest_lat, dest_lon, lang = key
            entries.append({
                "location": location,
                "radius_km": radius_km,
                "num_pois": num_pois,
                "tags": [{"key": t.key, "value": t.value} for t in tags],
                "dest_lat": dest_lat,
                "dest_lon": dest_lon,
                "lang": lang,
                "expires_at": expires_at,
                "pois": [p.model_dump() for p in pois],
            })
        with open(POI_CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(entries, f)
        logging.info(f"POI cache saved: {len(entries)} entries → {POI_CACHE_FILE}")
    except Exception as e:
        logging.warning(f"POI cache save failed: {e}")


def load_poi_cache() -> None:
    """Load the persisted POI cache from disk on startup."""
    if not POI_CACHE_FILE.exists():
        return
    try:
        now = time.time()
        with open(POI_CACHE_FILE, "r", encoding="utf-8") as f:
            entries = json.load(f)
        loaded = 0
        for entry in entries:
            expires_at = entry["expires_at"]
            if expires_at <= now:
                continue  # skip expired
            key = (
                entry["location"], entry["radius_km"], entry["num_pois"],
                tuple(OverpassTag(key=t["key"], value=t["value"]) for t in entry["tags"]),
                entry["dest_lat"], entry["dest_lon"], entry["lang"],
            )
            pois = [LLMPOISuggestion(**p) for p in entry["pois"]]
            _poi_cache[key] = (expires_at, pois)
            loaded += 1
        logging.info(f"POI cache loaded: {loaded} valid entries from {POI_CACHE_FILE}")
    except Exception as e:
        logging.warning(f"POI cache load failed: {e}")
