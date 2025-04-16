from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from config import settings
from init_db import init as init_db
from fastapi.security import OAuth2PasswordBearer
from routers import auth, user, poi, saved_path, interests
from sqlalchemy.exc import SQLAlchemyError
from fastapi.exceptions import HTTPException
from error_handlers import (
    http_exception_handler,
    sqlalchemy_exception_handler,
    unhandled_exception_handler
)
import logging
from utils.ollama_wait import wait_for_ollama_ready

wait_for_ollama_ready() # Wait for Ollama to be ready before starting the app

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting up app...")
    load_dotenv()
    if settings.env == "dev":
        init_db()
    else:
        print("Skipping table drop in production 🚫")

    yield
    print("🛑 App shutdown complete.")

app = FastAPI(
    title="Travel Assistant API",
    description="Helps users find routes depending on personal interests",
    version="1.0.0",
    # swagger_ui_init_oauth={
    #     "usePkceWithAuthorizationCodeGrant": True,
    # },
    lifespan=lifespan,  # Use the async context manager for lifespan
)

# Only show ERRORs from SQLAlchemy
logging.getLogger("sqlalchemy.engine").setLevel(logging.ERROR)

# Suppress other noisy FastAPI loggers
logging.getLogger("uvicorn.access").setLevel(logging.ERROR)
logging.getLogger("uvicorn.error").setLevel(logging.ERROR)
logging.getLogger("httpx").setLevel(logging.ERROR)

# Register custom handlers
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.include_router(user.router, prefix="/users", tags=["Users"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(poi.router, prefix="/api", tags=["POIs"])
app.include_router(saved_path.router, prefix="/paths", tags=["Saved Paths"])
app.include_router(interests.router, prefix="/api")
