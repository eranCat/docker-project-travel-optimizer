# schemas/route_request.py

from pydantic import BaseModel, Field


class RouteGenerationRequest(BaseModel):
    interests: str = Field(..., description="User interests in plain text")
    location: str = Field(..., description="Free-form location string")
    radius_km: float = Field(2.0, gt=0, description="Search radius in kilometers")
    num_routes: int = Field(3, gt=0, description="Number of route options to generate")
    num_pois: int = Field(5, gt=1, description="Number of POIs per route")
