"""Pydantic response models for the Intelligence API."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

ReadingLevel = Literal["child", "layperson", "legal"]


class PersonEntity(BaseModel):
    name: str
    role: str | None = None
    confidence: float = Field(..., ge=0.0, le=1.0)


class OrganisationEntity(BaseModel):
    name: str
    type: str | None = None


class EventEntity(BaseModel):
    type: str
    date_mentioned: str | None = None
    description: str


class ExtractEntitiesResponse(BaseModel):
    people: list[PersonEntity] = Field(default_factory=list)
    organisations: list[OrganisationEntity] = Field(default_factory=list)
    events: list[EventEntity] = Field(default_factory=list)
    crimes_alleged: list[str] = Field(default_factory=list)
    locations: list[str] = Field(default_factory=list)


class LegalReference(BaseModel):
    act_name: str
    short_name: str
    section: str
    relevance: str
    is_constitutional: bool = False
    act_number: str | None = Field(
        default=None,
        description="E.g. '12 of 2004'. Empty / None for common-law crimes.",
    )


class LegalMapResponse(BaseModel):
    references: list[LegalReference] = Field(default_factory=list)


class SimplifyResponse(BaseModel):
    simplified: str
    reading_level: ReadingLevel


class ClusterResponse(BaseModel):
    matched_story_id: str | None = Field(
        default=None,
        description="UUID of the matched story, or None when no candidate clears the threshold.",
    )
    confidence: float = Field(..., ge=0.0, le=1.0)
    reasoning: str
