import time

_CACHE_TTL = 3600  # 1 hour
_CACHE_MAX = 200

# route_id -> (expires_at, routes, request_data, pois_pool)
_store: dict = {}


def _evict_expired() -> None:
    now = time.time()
    expired = [k for k, v in list(_store.items()) if v[0] < now]
    for k in expired:
        del _store[k]


class _RoutesCache:
    def __setitem__(self, key: str, value) -> None:
        # value is (routes, request_data, pois_pool)
        routes, request_data, pois_pool = value
        _evict_expired()
        if len(_store) >= _CACHE_MAX:
            oldest = min(_store, key=lambda k: _store[k][0])
            del _store[oldest]
        _store[key] = (time.time() + _CACHE_TTL, routes, request_data, pois_pool)

    def get(self, key: str) -> list | None:
        entry = _store.get(key)
        if entry is None:
            return None
        if time.time() > entry[0]:
            del _store[key]
            return None
        return entry[1]

    def get_full(self, key: str):
        """Returns (routes, request_data, pois_pool) or None."""
        entry = _store.get(key)
        if entry is None:
            return None
        if time.time() > entry[0]:
            del _store[key]
            return None
        _, routes, request_data, pois_pool = entry
        return routes, request_data, pois_pool

    def update_routes(self, key: str, new_routes: list) -> None:
        entry = _store.get(key)
        if entry is None:
            return
        exp, _, request_data, pois_pool = entry
        _store[key] = (exp, new_routes, request_data, pois_pool)


routes_cache = _RoutesCache()
