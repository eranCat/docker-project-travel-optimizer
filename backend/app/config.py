import os
from dotenv import load_dotenv

load_dotenv()  # Load variables from .env file

class Settings:
    PROJECT_NAME: str = "Travel Itinerary Optimizer"
    MONGO_USER: str = os.getenv("MONGO_INITDB_ROOT_USERNAME", "root")
    MONGO_PASSWORD: str = os.getenv("MONGO_INITDB_ROOT_PASSWORD", "rootpassword123")
    MONGO_HOST: str = os.getenv("MONGO_HOST", "mongodb")
    MONGO_PORT: str = os.getenv("MONGO_PORT", "27017")
    MONGO_DB: str = os.getenv("MONGO_INITDB_DATABASE", "travel_db")
    MONGO_URI: str = f"mongodb://{MONGO_USER}:{MONGO_PASSWORD}@{MONGO_HOST}:{MONGO_PORT}/{MONGO_DB}?authSource=admin"
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

settings = Settings()
