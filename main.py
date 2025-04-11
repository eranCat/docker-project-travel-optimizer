from fastapi import FastAPI
from routers import user, poi, aco

app = FastAPI()

app.include_router(user.router, prefix="/users", tags=["Users"])
app.include_router(poi.router, prefix="/pois", tags=["POIs"])
app.include_router(aco.router, prefix="/aco", tags=["ACO"])