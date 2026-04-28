"""Pydantic request models for the Intelligence API."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

ReadingLevel = Literal["child", "layperson", "legal"]


class ExtractEntitiesRequest(BaseModel):
    """Input for POST /api/entities/extract."""

    text: str = Field(..., min_length=1, description="Free-form text to extract entities from.")


class SimplifyRequest(BaseModel):
    """Input for POST /api/summary/simplify."""

    text: str = Field(..., min_length=1, description="Source text to simplify.")
    level: ReadingLevel = Field(
        ...,
        description="Target reading level: child (≈10yo), layperson (no legal background), legal (analyst).",
    )


class ClusterRequest(BaseModel):
    """Input for POST /api/cluster/match.

    `story_candidates` is a list of dicts describing existing stories. Each dict
    is expected to contain at minimum an `id` and a `title`; optional fields
    `summary`, `plain_english_summary`, and `keywords` are also used when
    present to improve the similarity score.
    """

    headline: str = Field(..., min_length=1)
    text: str = Field(..., min_length=1)
    story_candidates: list[dict[str, Any]] = Field(default_factory=list)


class LegalMapRequest(BaseModel):
    """Input for POST /api/legal/map."""

    crimes_alleged: list[str] = Field(
        ...,
        min_length=1,
        description="Human-readable crime names — e.g. ['corruption', 'tender fraud'].",
    )
    context: str = Field(
        default="",
        description="Optional free-text context to improve mapping (currently unused, reserved).",
    )
