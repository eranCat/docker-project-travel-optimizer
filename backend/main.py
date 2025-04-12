from fastapi import FastAPI
from backend.routers import user, poi, aco, saved_path
from dotenv import load_dotenv
from .init_db import init as init_db

load_dotenv()

init_db()

app = FastAPI()

app.include_router(user.router, prefix="/users", tags=["Users"])
app.include_router(poi.router, prefix="/pois", tags=["POIs"])
app.include_router(aco.router, prefix="/aco", tags=["ACO"])
app.include_router(saved_path.router, prefix="/paths", tags=["Saved Paths"])
