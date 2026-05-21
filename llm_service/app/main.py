from fastapi import FastAPI
from app.api.routes import router

app = FastAPI(title="LLM Service")

app.include_router(router)

@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {"status": "healthy"}
