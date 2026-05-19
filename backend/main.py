import logging
import time
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from routers import autocomplete_location, health, route_progress
from fastapi.exceptions import HTTPException
from utils.error_handlers import (
    http_exception_handler,
    unhandled_exception_handler,
)
from fastapi.middleware.cors import CORSMiddleware

LOG_DIR = Path(__file__).parent.parent / "logs"
LOG_DIR.mkdir(exist_ok=True)
LOG_FILE = LOG_DIR / "backend.log"

root_logger = logging.getLogger()
root_logger.setLevel(logging.DEBUG)
file_handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
file_handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s | %(message)s"))
if not any(isinstance(h, logging.FileHandler) and getattr(h, "baseFilename", None) == str(LOG_FILE) for h in root_logger.handlers):
    root_logger.addHandler(file_handler)
# Quiet down noisy libs in the file log
for noisy in ("httpcore", "httpx", "urllib3", "openai._base_client"):
    logging.getLogger(noisy).setLevel(logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logging.info("=== Backend starting up ===")
    load_dotenv()
    yield
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

# Register custom handlers
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.include_router(autocomplete_location.router)
app.include_router(route_progress.router)

app.include_router(health.router)


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
