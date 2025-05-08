from fastapi import APIRouter
import requests
from models.route_request import RouteGenerationRequest

router = APIRouter()


@router.post("/generate-paths")
def generate_paths(request: RouteGenerationRequest):
    try:
        res = requests.post(
            "http://maps-service:8001/routes/", json=request.model_dump()
        )
        res.raise_for_status()
        return res.json()
    except requests.RequestException as e:
        raise Exception(f"Error calling maps_service: {str(e)}")
