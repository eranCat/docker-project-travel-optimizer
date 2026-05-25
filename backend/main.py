import logging
import time
from collections import defaultdict
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from routers import autocomplete_location, health, route_progress, replace_poi
from services.maps.overpass_service import get_overpass_tags_from_interests, _poi_cache, load_poi_cache, save_poi_cache
from fastapi.exceptions import HTTPException
from utils.error_handlers import (
    http_exception_handler,
    unhandled_exception_handler,
)
from utils.log_cleanup import clear_log
from fastapi.middleware.cors import CORSMiddleware

_ip_requests: dict[str, list[float]] = defaultdict(list)
RATE_WINDOW_SEC = 60
RATE_MAX = 5

LOG_DIR = Path(__file__).parent.parent / "logs"
LOG_DIR.mkdir(exist_ok=True)
LOG_FILE = LOG_DIR / "backend.log"

root_logger = logging.getLogger()
root_logger.setLevel(logging.DEBUG)
# Remove any StreamHandlers that may use Windows cp1252/charmap encoding —
# they raise UnicodeEncodeError on emoji characters (e.g. from watchfiles reload
# messages). All log output goes to our UTF-8 file handler instead.
for _h in root_logger.handlers[:]:
    if isinstance(_h, logging.StreamHandler) and not isinstance(_h, logging.FileHandler):
        root_logger.removeHandler(_h)
file_handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
file_handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s | %(message)s"))
if not any(isinstance(h, logging.FileHandler) and getattr(h, "baseFilename", None) == str(LOG_FILE) for h in root_logger.handlers):
    root_logger.addHandler(file_handler)
for noisy in ("httpcore", "httpx", "urllib3", "openai._base_client"):
    logging.getLogger(noisy).setLevel(logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    clear_log()
    logging.info("=== Backend starting up ===")
    load_dotenv()
    get_overpass_tags_from_interests.cache_clear()
    _poi_cache.clear()
    load_poi_cache()
    yield
    save_poi_cache()
    logging.info("=== Backend shutdown ===")

app = FastAPI(
    title="Travel Assistant API",
    description="Helps users find routes depending on personal interests",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.include_router(autocomplete_location.router)
app.include_router(route_progress.router)
app.include_router(replace_poi.router)
app.include_router(health.router)


@app.middleware("http")
async def rate_limit(request: Request, call_next):
    if "/route-progress" in request.url.path:
        ip = request.client.host if request.client else "unknown"
        now = time.time()
        window_start = now - RATE_WINDOW_SEC
        recent = [t for t in _ip_requests[ip] if t > window_start]
        _ip_requests[ip] = recent
        if len(recent) >= RATE_MAX:
            logging.warning(f"Rate limit hit for {ip}: {len(recent)} requests in {RATE_WINDOW_SEC}s")
            return JSONResponse(
                status_code=429,
                content={"detail": f"Too many requests. You can generate up to {RATE_MAX} routes per minute."},
            )
        _ip_requests[ip].append(now)
    return await call_next(request)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    try:
        response = await call_next(request)
        dur_ms = int((time.time() - start) * 1000)
        logging.info(
            f"{request.method} {request.url.path}{('?' + request.url.query) if request.url.query else ''} "
            f"-> {response.status_code} ({dur_ms}ms)"
        )
        return response
    except Exception:
        dur_ms = int((time.time() - start) * 1000)
        logging.exception(f"{request.method} {request.url.path} FAILED ({dur_ms}ms)")
        raise


@app.post("/frontend-log")
async def frontend_log(payload: dict):
    level = (payload.get("level") or "info").upper()
    message = payload.get("message", "")
    data = payload.get("data")
    logging.log(
        getattr(logging, level, logging.INFO),
        f"[frontend] {message}{' | ' + str(data) if data else ''}",
    )
    return {"ok": True}


# ── Serve pre-built React frontend (monolith: single port 8000) ──
from fastapi.staticfiles import StaticFiles as _StaticFiles
from fastapi.responses import FileResponse as _FileResponse

_DIST = Path(__file__).parent.parent / "frontend" / "dist"

if _DIST.exists():
    app.mount("/assets", _StaticFiles(directory=str(_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        return _FileResponse(str(_DIST / "index.html"))
