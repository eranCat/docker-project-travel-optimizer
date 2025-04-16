# backend/routers/route.py
from fastapi import APIRouter
from schemas.route import SuggestRouteRequest, RouteResponse

from services.route_optimizer import optimize_route

router = APIRouter(prefix="/route", tags=["Route"])

@router.post("/suggest", response_model=RouteResponse)
def suggest_route(request: SuggestRouteRequest):
    pois = get_mocked_pois(request.interests, request.location)
    ordered_pois, total_distance = optimize_route(pois)
    return RouteResponse(pois=ordered_pois, total_distance_km=round(total_distance, 2))
