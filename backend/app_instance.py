# backend/app_instance.py
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from backend.init_db import init as init_db
from fastapi.security import HTTPBearer, OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting up app...")
    load_dotenv()
    init_db()
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
