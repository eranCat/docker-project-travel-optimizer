from fastapi import FastAPI
from app.models import PathRequest, PathResponse
from app.aco_engine import ACOEngine

app = FastAPI()

@app.post("/find-path/", response_model=PathResponse)
def find_path(request: PathRequest):
    engine = ACOEngine(request)
    path, distance = engine.run()
    return PathResponse(optimal_path=path, total_distance=distance)