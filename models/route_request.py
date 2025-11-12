from pydantic import BaseModel, Field


class RouteGenerationRequest(BaseModel):
    interests: str = Field(..., description="Comma-separated list of user interests")
    location: str = Field(..., description="Free-form location text (e.g. 'Tel Aviv')")
    radius_km: float = Field(..., gt=0, description="Search radius in kilometers")
    num_routes: int = Field(
        ..., ge=1, description="How many alternative routes to generate"
    )
    num_pois: int = Field(..., ge=1, description="Number of POIs per route")
    travel_mode: str = Field(..., description="One of: walking, driving, cycling")

    def __hash__(self):
        return hash((self.interests, self.location, self.radius_km, self.num_routes, self.num_pois, self.travel_mode))
