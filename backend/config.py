from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ors_api_key: str
    groq_api_key: str
    overpass_api_url: str = "https://overpass.kumi.systems/api/interpreter"

    class Config:
        env_file = ".env"


settings = Settings()
