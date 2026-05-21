import logging
import math
import random
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from typing import List, Tuple

from fastapi import HTTPException
from services.maps.route_service import get_real_route
from models.llm_suggestion import LLMPOISuggestion
from models.route_request import RouteGenerationRequest
from geopy.distance import geodesic

_VIBE_MAP = {
    "restaurant": "Foodie trail", "cafe": "Coffee lovers' walk", "bar": "Bar crawl",
    "pub": "Pub crawl", "nightclub": "Nightlife circuit", "brewery": "Craft beer tour",
    "museum": "Museum circuit", "gallery": "Art scene tour", "arts_centre": "Arts & culture",
    "castle": "Historic journey", "ruins": "Ancient ruins walk", "monument": "Heritage trail",
    "park": "Nature escape", "garden": "Garden stroll", "viewpoint": "Scenic lookout tour",
    "theatre": "Theatre district walk", "cinema": "Entertainment circuit",
    "attraction": "Sightseeing tour", "zoo": "Wildlife adventure",
    "aquarium": "Marine discovery", "theme_park": "Amusement adventure",
}


def compute_route_vibe(pois: List[LLMPOISuggestion]) -> str:
    counts = Counter(cat for p in pois for cat in p.categories)
    for cat, _ in counts.most_common():
        if cat in _VIBE_MAP:
            return _VIBE_MAP[cat]
    return "Mixed discovery route"


TRAVEL_MODE_MAPPING = {
    "walking": "foot-walking",
    "driving": "driving-car",
    "cycling": "cycling-regular",
}


def _dist(a: LLMPOISuggestion, b: LLMPOISuggestion) -> float:
    return geodesic((a.latitude, a.longitude), (b.latitude, b.longitude)).meters


def _cluster_pois(
    pois: List[LLMPOISuggestion], radius_m: float
) -> List[List[LLMPOISuggestion]]:
    """
    Simple single-linkage clustering: any POI within `radius_m` of another is
    in the same cluster. Returns clusters sorted by descending size, so the
    densest cluster comes first.
    """
    unvisited = list(pois)
    clusters: List[List[LLMPOISuggestion]] = []
    while unvisited:
        seed = unvisited.pop(0)
        cluster = [seed]
        # Expand cluster: anything within radius of any current member joins
        i = 0
        while i < len(cluster):
            member = cluster[i]
            new_members = [p for p in unvisited if _dist(member, p) <= radius_m]
            for p in new_members:
                unvisited.remove(p)
                cluster.append(p)
            i += 1
        clusters.append(cluster)
    clusters.sort(key=len, reverse=True)
    return clusters


def _select_route_pois(
    pool: List[LLMPOISuggestion],
    num_pois: int,
    start_poi: LLMPOISuggestion,
    cluster_radius_m: float,
) -> List[LLMPOISuggestion]:
    """
    One-POI-per-category selection.

    Hard rule: each OSM category appears at most once in the route. We pick the
    nearest available POI from each unused category, walking outward from the
    starting point. If the area has fewer distinct categories than num_pois,
    the route will be shorter than requested (rather than padded with repeats).

    A small cluster-jump penalty still discourages zigzagging when there are
    multiple POIs of the same fresh category to choose from.
    """
    if start_poi not in pool:
        pool = [start_poi] + list(pool)

    clusters = _cluster_pois(pool, cluster_radius_m)
    cluster_id: dict = {}
    for ci, c in enumerate(clusters):
        for p in c:
            cluster_id[id(p)] = ci

    selected: List[LLMPOISuggestion] = [start_poi]
    used_cats: set = set(start_poi.categories)
    remaining = [p for p in pool if p is not start_poi]
    current = start_poi
    current_cluster = cluster_id.get(id(start_poi), -1)

    CLUSTER_JUMP_PENALTY_M = 400.0  # mild — only breaks ties between equivalents

    while remaining and len(selected) < num_pois:
        # Hard filter: only POIs whose categories haven't been used yet
        fresh = [p for p in remaining if not used_cats.intersection(p.categories)]
        if not fresh:
            # No unused categories left — stop rather than repeat.
            logging.debug(
                f"  Stopping at {len(selected)} POIs: no more fresh categories "
                f"(used: {used_cats})"
            )
            break

        def score(p: LLMPOISuggestion) -> float:
            d = _dist(current, p)
            if cluster_id.get(id(p), -2) != current_cluster:
                d += CLUSTER_JUMP_PENALTY_M
            return d

        nxt = min(fresh, key=score)
        selected.append(nxt)
        used_cats.update(nxt.categories)
        remaining.remove(nxt)
        current = nxt
        current_cluster = cluster_id.get(id(nxt), -1)

    return selected


def _same_category(a: LLMPOISuggestion, b: LLMPOISuggestion) -> bool:
    return bool(set(a.categories).intersection(b.categories))


def _route_cost(route: List[LLMPOISuggestion]) -> float:
    """
    Total tour cost = sum of geodesic edges + a category-repeat penalty.
    The penalty (200m equivalent per same-category neighbor pair) discourages
    2-opt from creating adjacent same-category POIs while still allowing them
    when the distance savings are substantial.
    """
    REPEAT_PENALTY_M = 200.0
    total = 0.0
    for i in range(len(route) - 1):
        total += _dist(route[i], route[i + 1])
        if _same_category(route[i], route[i + 1]):
            total += REPEAT_PENALTY_M
    return total


def _two_opt(route: List[LLMPOISuggestion]) -> List[LLMPOISuggestion]:
    """
    2-opt improvement: iteratively reverse any segment whose removal+reversal
    reduces the tour cost (distance + category-repeat penalty). Eliminates
    self-crossings and discourages adjacent same-category POIs.
    Bounded to 50 passes.
    """
    if len(route) < 4:
        return route
    best = list(route)
    best_cost = _route_cost(best)
    n = len(best)
    for _ in range(50):
        improved = False
        for i in range(n - 1):
            for j in range(i + 2, n):
                candidate = list(best)
                candidate[i + 1 : j + 1] = candidate[i + 1 : j + 1][::-1]
                cand_cost = _route_cost(candidate)
                if cand_cost + 1e-6 < best_cost:
                    best = candidate
                    best_cost = cand_cost
                    improved = True
        if not improved:
            break
    return best


def _pick_distinct_starts(
    pois: List[LLMPOISuggestion], num_routes: int
) -> List[LLMPOISuggestion]:
    """
    Farthest-point sampling for starting POIs so each route begins from a
    different part of the area.
    """
    if not pois:
        return []
    if num_routes >= len(pois):
        return list(pois)

    starts = [random.choice(pois)]
    while len(starts) < num_routes:
        next_start = max(
            (p for p in pois if p not in starts),
            key=lambda p: min(_dist(p, s) for s in starts),
        )
        starts.append(next_start)
    return starts


def generate_optimized_routes(
    request: RouteGenerationRequest, pois: List[LLMPOISuggestion]
):
    num_routes = request.num_routes
    num_pois = request.num_pois

    # Count distinct categories — with one-POI-per-category enforcement,
    # this is the real cap on route length.
    distinct_cats: set = set()
    for p in pois:
        distinct_cats.update(p.categories)
    logging.debug(
        f"Trying to build {num_routes} routes from {len(pois)} POIs "
        f"across {len(distinct_cats)} distinct categories"
    )

    # Need at least 2 POIs (any 2 distinct categories) to form a route
    if len(distinct_cats) < 2:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Only {len(distinct_cats)} distinct categories found in area. "
                "Try broadening interests or increasing the radius."
            ),
        )

    if len(distinct_cats) < num_pois:
        logging.info(
            f"Only {len(distinct_cats)} distinct categories available; routes "
            f"will be capped at {len(distinct_cats)} POIs (requested {num_pois})."
        )

    ors_profile = TRAVEL_MODE_MAPPING.get(request.travel_mode, "foot-walking")

    # Cluster radius: POIs within this distance of each other count as the
    # same "pocket" worth visiting together. Scales with travel mode:
    # tighter for walking (300m), wider for driving (1500m).
    cluster_radius_m = {
        "walking": 300.0,
        "cycling": 600.0,
        "driving": 1500.0,
    }.get(request.travel_mode, 300.0)

    # ── Phase 1: select POIs for each route (sequential — each route depends on
    # the previous ones via used_pois and farthest-point start spreading). This
    # is pure in-memory work, no network. ──
    used_pois: set = set()
    plans: List[dict] = []  # {"start_poi", "selected"}

    for route_idx in range(num_routes):
        # Each route draws from POIs not yet used by an earlier route
        available = [p for p in pois if id(p) not in used_pois]
        logging.info(
            f"Route {route_idx + 1}: {len(available)} unused POIs available "
            f"(total pool {len(pois)}, already-used {len(used_pois)})"
        )
        if len(available) < 2:
            logging.info(
                f"Route {route_idx + 1}: only {len(available)} unused POIs left, "
                "stopping route generation."
            )
            break

        # Pick a starting POI for this route — spread out from previous routes'
        # start points so each route explores a different part of the area.
        prior_starts = [pl["start_poi"] for pl in plans]
        if prior_starts:
            start_poi = max(
                available,
                key=lambda p: min(_dist(p, s) for s in prior_starts),
            )
        else:
            start_poi = random.choice(available)

        pool = list(available)
        random.shuffle(pool)

        selected = _select_route_pois(pool, num_pois, start_poi, cluster_radius_m)
        before_cost = _route_cost(selected)
        selected = _two_opt(selected)
        after_cost = _route_cost(selected)
        adjacent_same = sum(
            1
            for i in range(len(selected) - 1)
            if _same_category(selected[i], selected[i + 1])
        )
        logging.info(
            f"Route from '{start_poi.name}': {len(selected)} POIs, "
            f"cost {before_cost:.0f} -> {after_cost:.0f} after 2-opt "
            f"({adjacent_same} adjacent same-category pairs)"
        )
        logging.debug(f"  Order: {[(p.name, p.categories) for p in selected]}")

        if len(selected) < 2:
            continue

        # Reserve these POIs so the next route doesn't reuse them.
        for p in selected:
            used_pois.add(id(p))
        plans.append({"start_poi": start_poi, "selected": selected})

    # ── Phase 2: fetch real route geometry for each plan in parallel. get_real_route
    # is blocking HTTP (ORS), so a thread pool overlaps the N calls instead of
    # running them back-to-back. ex.map preserves plan order. ──
    def _build_route(plan: dict):
        selected = plan["selected"]
        coords = [(p.longitude, p.latitude) for p in selected]
        try:
            path, duration_seconds = get_real_route(coords, profile=ors_profile)
            if not path or len(path) < 2:
                logging.warning(
                    f"Invalid path returned: {len(path) if path else 0} points"
                )
                return None
            logging.debug(f"Successfully got route with {len(path)} points, duration {duration_seconds:.0f}s")
            return path, duration_seconds
        except Exception as e:
            logging.error(f"Routing error for {len(coords)} waypoints: {str(e)}")
            return None

    routes = []
    if plans:
        with ThreadPoolExecutor(max_workers=min(len(plans), 5)) as executor:
            for plan, built in zip(plans, executor.map(_build_route, plans)):
                if built is None:
                    continue
                path, duration_seconds = built
                selected = plan["selected"]
                routes.append(
                    {
                        "feature": {
                            "type": "Feature",
                            "geometry": {"type": "LineString", "coordinates": path},
                        },
                        "pois": [p.model_dump() for p in selected],
                        "duration_seconds": duration_seconds,
                        "vibe": compute_route_vibe(selected),
                    }
                )

    if not routes:
        raise HTTPException(
            status_code=400, detail="Could not generate any valid routes."
        )

    return {"routes": routes}


def _project_t(p: Tuple[float, float], a: Tuple[float, float], b: Tuple[float, float]) -> float:
    """Position of point p projected onto segment a→b, as t in [0, 1]
    (0 = at A, 1 = at B). Local equirectangular projection."""
    mean_lat = math.radians((a[0] + b[0]) / 2.0)
    mx = 111_320.0 * math.cos(mean_lat)
    my = 111_320.0
    ax, ay = a[1] * mx, a[0] * my
    bx, by = b[1] * mx, b[0] * my
    px, py = p[1] * mx, p[0] * my
    dx, dy = bx - ax, by - ay
    seg_len_sq = dx * dx + dy * dy
    if seg_len_sq == 0:
        return 0.0
    t = ((px - ax) * dx + (py - ay) * dy) / seg_len_sq
    return max(0.0, min(1.0, t))


def _perp_dist_m(p: Tuple[float, float], a: Tuple[float, float], b: Tuple[float, float]) -> float:
    """Perpendicular distance (metres) from p to its projection onto segment a→b —
    i.e. how far off the direct route the POI sits."""
    t = _project_t(p, a, b)
    proj = (a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]))
    return geodesic(p, proj).meters


def generate_point_to_point_route(
    request: RouteGenerationRequest, pois: List[LLMPOISuggestion]
):
    """A→B mode: a single route from start (latitude, longitude) to destination
    (dest_latitude, dest_longitude), passing through up to num_pois POIs picked
    one-per-category and ordered by their progress along the A→B corridor."""
    a = (request.latitude, request.longitude)
    b = (request.dest_latitude, request.dest_longitude)
    if None in a or None in b:
        raise HTTPException(status_code=400, detail="A→B mode requires start and destination coordinates.")

    num_pois = request.num_pois
    ors_profile = TRAVEL_MODE_MAPPING.get(request.travel_mode, "foot-walking")

    # Spread stops ALONG the corridor: split t∈[0,1] into num_pois bins and pick
    # one POI per bin. Without this, dense metro areas at one end (e.g. Tel Aviv)
    # win every "nearest" pick and all stops cluster there instead of marching
    # toward the destination.
    cand = [(_project_t((p.latitude, p.longitude), a, b), p) for p in pois]
    selected: List[LLMPOISuggestion] = []
    used_cats: set = set()
    for k in range(num_pois):
        lo, hi = k / num_pois, (k + 1) / num_pois
        bin_c = [
            (t, p) for (t, p) in cand
            if (lo <= t < hi) or (k == num_pois - 1 and t == 1.0)
        ]
        if not bin_c:
            continue
        # Within the bin prefer a fresh category, then the POI closest to the
        # direct line (smallest detour).
        def _key(tp):
            _t, p = tp
            fresh = 0 if used_cats.isdisjoint(p.categories) else 1
            return (fresh, _perp_dist_m((p.latitude, p.longitude), a, b))
        _t, pick = min(bin_c, key=_key)
        selected.append(pick)
        used_cats.update(pick.categories)
        cand = [(t, p) for (t, p) in cand if p is not pick]

    # Backfill any empty bins from the closest remaining POIs so we still hit
    # num_pois stops when some corridor segments are sparse.
    if len(selected) < num_pois and cand:
        cand.sort(key=lambda tp: _perp_dist_m((tp[1].latitude, tp[1].longitude), a, b))
        for _t, p in cand:
            if len(selected) >= num_pois:
                break
            selected.append(p)

    # Final corridor order (start → destination).
    selected.sort(key=lambda p: _project_t((p.latitude, p.longitude), a, b))

    logging.info(
        f"A→B route: {len(selected)}/{len(pois)} POIs selected between "
        f"{a} and {b} (requested {num_pois})"
    )
    logging.debug(f"  Order: {[(p.name, p.categories) for p in selected]}")

    # Waypoints: start anchor → POIs (corridor order) → destination anchor.
    # (lon, lat) for ORS.
    coords = [(a[1], a[0])] + [(p.longitude, p.latitude) for p in selected] + [(b[1], b[0])]
    try:
        path, duration_seconds = get_real_route(coords, profile=ors_profile)
        if not path or len(path) < 2:
            raise HTTPException(status_code=400, detail="Could not build a route between the two locations.")
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"A→B routing error for {len(coords)} waypoints: {e}")
        raise HTTPException(status_code=503, detail="Route service unavailable. Please try again.")

    route = {
        "feature": {
            "type": "Feature",
            "geometry": {"type": "LineString", "coordinates": path},
        },
        "pois": [p.model_dump() for p in selected],
        "duration_seconds": duration_seconds,
        "vibe": compute_route_vibe(selected) if selected else "Direct route",
    }
    return {"routes": [route]}
