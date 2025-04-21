# backend/config.py
from pydantic import field_validator
from pydantic_settings import BaseSettings
from typing import Literal

class Settings(BaseSettings):
    # Environment
    env: Literal["dev", "prod"] = "dev"

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
