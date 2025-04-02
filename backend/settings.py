from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Travel Itinerary Optimizer API"
    DATABASE_URL: str = "sqlite:///./test.db"  # Replace with your actual database URL, e.g., a PostgreSQL URL

    class Config:
        env_file = ".env"  # This lets you load settings from a .env file if present

# Create a settings instance that can be imported elsewhere
settings = Settings()
