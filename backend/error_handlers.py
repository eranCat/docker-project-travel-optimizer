# backend/error_handlers.py

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

# Handle all HTTPExceptions like 404, 400, 403, etc.
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail if isinstance(exc.detail, str) else "HTTP Error",
            "status": exc.status_code,
            "path": str(request.url.path)
        }
    )

# Handle database errors (SQLAlchemy)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Database error occurred",
            "details": str(exc.__class__.__name__),
            "status": 500,
            "path": str(request.url.path)
        }
    )

# Optionally: catch any uncaught exception
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "details": str(exc),
            "status": 500,
            "path": str(request.url.path)
        }
    )
