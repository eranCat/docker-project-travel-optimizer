# backend/app_instance.py
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from config import settings
from init_db import init as init_db
from fastapi.security import OAuth2PasswordBearer
from tests.health_check import run_startup_tests
from tests.test_user import test_user_login_logout

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting up app...")
    load_dotenv()
    if settings.env == "dev":
        init_db()
    else:
        print("Skipping table drop in production 🚫")

    if settings.env == "dev":
        run_startup_tests()
        test_user_login_logout(app)

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
