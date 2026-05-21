import logging

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse


async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail if isinstance(exc.detail, str) else "HTTP Error",
            "status": exc.status_code,
            "path": str(request.url.path),
        },
    )


async def unhandled_exception_handler(request: Request, exc: Exception):
    # FastAPI may route HTTPException here in some versions — delegate correctly.
    if isinstance(exc, HTTPException):
        return await http_exception_handler(request, exc)
    logging.exception(f"Unhandled exception on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "details": str(exc),
            "status": 500,
            "path": str(request.url.path),
        },
    )
