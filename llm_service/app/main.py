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

@router.post("/test-groq")
def test_groq():
    return call_groq_for_tags("coffee, yoga", {"tourism": ["museum", "zoo"], "leisure": ["park"]})
