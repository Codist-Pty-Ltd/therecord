"""Relevance scoring endpoints."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from config import get_settings
from core.relevance import RelevanceScore, is_relevant, score

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/relevance", tags=["relevance"])


class RelevanceScoreRequest(BaseModel):
    text: str = Field(min_length=1)


class RelevanceScoreResponse(BaseModel):
    score: float
    method: str
    model: str
    relevant: bool
    threshold: float
    cold_start: bool = False


@router.post(
    "/score",
    response_model=RelevanceScoreResponse,
    summary="Score text against the indexed corpus centroid",
)
async def relevance_score(payload: RelevanceScoreRequest) -> RelevanceScoreResponse:
    query = payload.text.strip()
    if not query:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="text must not be empty",
        )

    settings = get_settings()
    result: RelevanceScore = await score(query)
    return RelevanceScoreResponse(
        score=result.score,
        method=result.method,
        model=result.model,
        relevant=is_relevant(result),
        threshold=settings.relevance_threshold,
        cold_start=result.cold_start,
    )
