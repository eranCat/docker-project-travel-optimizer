import logging
import random
from typing import List

from fastapi import HTTPException
from services.maps.route_service import get_real_route
from models.llm_suggestion import LLMPOISuggestion
from models.route_request import RouteGenerationRequest
from geopy.distance import geodesic


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

    # POIs used by earlier routes — later routes must not reuse them.
    used_pois: set = set()
    routes = []

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
        prior_starts = [r["_start"] for r in routes if "_start" in r]
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

        coords = [(p.longitude, p.latitude) for p in selected]
        try:
            path = get_real_route(coords, profile=ors_profile)
            if not path or len(path) < 2:
                logging.warning(
                    f"Invalid path returned: {len(path) if path else 0} points"
                )
                continue
            logging.debug(f"Successfully got route with {len(path)} points")
        except Exception as e:
            logging.error(f"Routing error for {len(coords)} waypoints: {str(e)}")
            continue

        # Mark this route's POIs as used so subsequent routes don't reuse them.
        for p in selected:
            used_pois.add(id(p))

        routes.append(
            {
                "feature": {
                    "type": "Feature",
                    "geometry": {"type": "LineString", "coordinates": path},
                },
                "pois": [p.model_dump() for p in selected],
                "_start": start_poi,  # internal — used for next route's farthest-point pick
            }
        )

    if not routes:
        raise HTTPException(
            status_code=400, detail="Could not generate any valid routes."
        )

    # Strip internal fields before returning
    for r in routes:
        r.pop("_start", None)

    return {"routes": routes}
