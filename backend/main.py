from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from routers import generate_paths, autocomplete_location, health, route_progress
from fastapi.exceptions import HTTPException
from utils.error_handlers import (
    http_exception_handler,
    unhandled_exception_handler,
)
import logging
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting up app... 🚀")
    load_dotenv()
    yield
    print("🛑 App shutdown complete.")

app = FastAPI(
    title="Travel Assistant API",
    description="Helps users find routes depending on personal interests",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Suppress other noisy FastAPI loggers
logging.getLogger("uvicorn.access").setLevel(logging.ERROR)
logging.getLogger("uvicorn.error").setLevel(logging.ERROR)
logging.getLogger("httpx").setLevel(logging.ERROR)

# Register custom handlers
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.include_router(generate_paths.router, prefix="/routes")
app.include_router(autocomplete_location.router)
app.include_router(route_progress.router)

app.include_router(health.router)
