from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from routers import generate_paths
from config import settings
from fastapi.exceptions import HTTPException
from utils.error_handlers import (
    http_exception_handler,
    unhandled_exception_handler,
)
import logging
from utils.ollama_wait import wait_for_ollama_ready

wait_for_ollama_ready()  # Wait for Ollama to be ready before starting the app

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

# Suppress other noisy FastAPI loggers
logging.getLogger("uvicorn.access").setLevel(logging.ERROR)
logging.getLogger("uvicorn.error").setLevel(logging.ERROR)
logging.getLogger("httpx").setLevel(logging.ERROR)

# Register custom handlers
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.include_router(generate_paths.router, prefix="/routes")
