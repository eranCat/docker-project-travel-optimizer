from app_instance import app
from routers import auth, user, poi, saved_path,interests
from sqlalchemy.exc import SQLAlchemyError
from fastapi.exceptions import HTTPException
from error_handlers import (
    http_exception_handler,
    sqlalchemy_exception_handler,
    unhandled_exception_handler
)
import logging

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
