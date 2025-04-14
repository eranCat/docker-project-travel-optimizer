from backend.config import ENV
from backend.routers import auth, user, poi, saved_path
from sqlalchemy.exc import SQLAlchemyError
from fastapi.exceptions import HTTPException
from backend.error_handlers import (
    http_exception_handler,
    sqlalchemy_exception_handler,
    unhandled_exception_handler
)
from backend.app_instance import app
from backend.tests.health_check import run_startup_tests
from backend.tests.test_user import test_user_login_logout

# Register custom handlers
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.include_router(user.router, prefix="/users", tags=["Users"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(poi.router, prefix="/api", tags=["POIs"])
app.include_router(saved_path.router, prefix="/paths", tags=["Saved Paths"])
# app.include_router(aco.router, prefix="/aco", tags=["ACO"])

if ENV == "dev":
    run_startup_tests()  # sync call is fine here
    test_user_login_logout()  # sync call is fine here