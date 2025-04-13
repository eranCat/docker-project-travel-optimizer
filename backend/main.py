from fastapi import FastAPI
from backend.routers import user, poi, aco, saved_path
from dotenv import load_dotenv
from sqlalchemy.exc import SQLAlchemyError
from fastapi.exceptions import RequestValidationError, HTTPException
from backend.error_handlers import (
    http_exception_handler,
    sqlalchemy_exception_handler,
    unhandled_exception_handler
)
from .init_db import init as init_db

load_dotenv()

init_db()

app = FastAPI()

# Register custom handlers
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.include_router(user.router, prefix="/users", tags=["Users"])
app.include_router(poi.router, prefix="/api", tags=["POIs"])
app.include_router(aco.router, prefix="/aco", tags=["ACO"])
app.include_router(saved_path.router, prefix="/paths", tags=["Saved Paths"])
