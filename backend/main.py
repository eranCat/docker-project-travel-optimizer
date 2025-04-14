from fastapi import FastAPI
from backend.routers import auth, user, poi, aco, saved_path
from dotenv import load_dotenv
from sqlalchemy.exc import SQLAlchemyError
from fastapi.exceptions import HTTPException
from backend.error_handlers import (
    http_exception_handler,
    sqlalchemy_exception_handler,
    unhandled_exception_handler
)
from backend.tests.health_check import run_startup_tests
from .init_db import init as init_db
from backend.tests.test_user import test_user

load_dotenv()

init_db()

run_startup_tests()
test_user()

app = FastAPI(
    title="Travel Assistant API",
    description="Helps users find routes depending on personal interests",
    version="1.0.0",
    swagger_ui_init_oauth={
        "usePkceWithAuthorizationCodeGrant": True,
    }
)

# Register custom handlers
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.include_router(user.router, prefix="/users", tags=["Users"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(poi.router, prefix="/api", tags=["POIs"])
app.include_router(saved_path.router, prefix="/paths", tags=["Saved Paths"])
app.include_router(aco.router, prefix="/aco", tags=["ACO"])
