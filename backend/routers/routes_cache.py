import time

_CACHE_TTL = 3600  # 1 hour
_CACHE_MAX = 200

# route_id -> (expires_at, routes)
_store: dict[str, tuple[float, list]] = {}


def _evict_expired() -> None:
    now = time.time()
    expired = [k for k, (exp, _) in _store.items() if exp < now]
    for k in expired:
        del _store[k]


class _RoutesCache:
    def __setitem__(self, key: str, value: list) -> None:
        _evict_expired()
        if len(_store) >= _CACHE_MAX:
            oldest = min(_store, key=lambda k: _store[k][0])
            del _store[oldest]
        _store[key] = (time.time() + _CACHE_TTL, value)

    def get(self, key: str) -> list | None:
        entry = _store.get(key)
        if entry is None:
            return None
        exp, routes = entry
        if time.time() > exp:
            del _store[key]
            return None
        return routes


routes_cache = _RoutesCache()