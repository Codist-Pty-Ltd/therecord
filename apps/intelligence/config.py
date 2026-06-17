"""Environment-driven settings for the intelligence service."""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables / `.env`."""

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )

    app_env: Literal["dev", "staging", "prod"] = "dev"
    database_url: str = Field(
        ...,
        description="PostgreSQL URL (password already URL-encoded, e.g. %23 for #)",
    )
    anthropic_api_key: str | None = Field(default=None, validation_alias="ANTHROPIC_API_KEY")
    anthropic_model: str = "claude-sonnet-4-6"
    embedding_model: str = "BAAI/bge-small-en-v1.5"
    embedding_dim: int = 384
    db_pool_min: int = 1
    db_pool_max: int = 5
    rag_min_similarity: float = 0.25
    rag_top_k: int = 6
    relevance_threshold: float = 0.45
    relevance_strategy: Literal["centroid", "model"] = "centroid"
    relevance_model_path: str | None = None
    link_confidence_threshold: float = 0.82
    log_level: str = "INFO"


@lru_cache
def get_settings() -> Settings:
    """Return cached settings singleton."""
    return Settings()  # type: ignore[call-arg]
