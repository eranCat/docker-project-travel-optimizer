from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
import os
from routers import health, route_progress, autocomplete
from fastapi.exceptions import HTTPException
from utils.error_handlers import (
    http_exception_handler,
    unhandled_exception_handler,
)
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

allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register custom handlers
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.include_router(route_progress.router)
app.include_router(autocomplete.router)
app.include_router(health.router)
