# backend/config.py
from pydantic import field_validator
from pydantic_settings import BaseSettings
from typing import Literal

class Settings(BaseSettings):
    # Environment
    env: Literal["dev", "prod"] = "dev"

    # Control flags
    clear_tables: bool = False

    # Database
    database_url: str
    postgres_db: str
    db_schema: str

    # Admin credentials
    admin_email: str
    admin_password: str

    postgres_user: str
    postgres_password: str


    # Security
    secret_key: str = "blablablablublublue"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # LLM-related
    ollama_url: str
    ollama_model: str

    @field_validator("env")
    @classmethod
    def validate_env(cls, v):
        if v not in ["dev", "prod"]:
            raise ValueError("ENV must be either 'dev' or 'prod'")
        return v

    class Config:
        env_file = ".env"

settings = Settings()
