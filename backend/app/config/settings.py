from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ENV_FILE = Path(__file__).resolve().parents[3] / ".env"


class Settings(BaseSettings):
    """Values that may change between development and production."""

    model_config = SettingsConfigDict(
        env_file=PROJECT_ENV_FILE,
        env_prefix="WISDOM_",
        extra="ignore",
    )

    api_title: str = "WisdomAI API"
    environment: str = "development"
    cors_origins: list[str] = ["http://localhost:5173"]
    database_url: str = "postgresql+psycopg://wisdom:wisdom@localhost:5432/wisdom"


@lru_cache
def get_settings() -> Settings:
    """Load settings once and reuse them for the process lifetime."""
    return Settings()
