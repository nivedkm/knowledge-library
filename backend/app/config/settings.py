from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Values that may change between development and production."""

    model_config = SettingsConfigDict(
        env_file="../.env",
        env_prefix="WISDOM_",
        extra="ignore",
    )

    api_title: str = "WisdomAI API"
    environment: str = "development"
    cors_origins: list[str] = ["http://localhost:5173"]


@lru_cache
def get_settings() -> Settings:
    """Load settings once and reuse them for the process lifetime."""
    return Settings()
