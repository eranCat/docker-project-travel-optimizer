from app_instance import app
from config import settings
from routers import auth, user, poi, saved_path,interests
from sqlalchemy.exc import SQLAlchemyError
from fastapi.exceptions import HTTPException
from error_handlers import (
    http_exception_handler,
    sqlalchemy_exception_handler,
    unhandled_exception_handler
)
from tests.health_check import run_startup_tests
from tests.test_user import test_user_login_logout

# Register custom handlers
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.include_router(user.router, prefix="/users", tags=["Users"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(poi.router, prefix="/api", tags=["POIs"])
app.include_router(saved_path.router, prefix="/paths", tags=["Saved Paths"])
app.include_router(interests.router, prefix="/api")
