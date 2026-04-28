"""Story clustering endpoints."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status

from models.requests import ClusterRequest
from models.responses import ClusterResponse
from services.nlp_service import cluster_match

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cluster", tags=["cluster"])


@router.post(
    "/match",
    response_model=ClusterResponse,
    summary="Match an incoming article to an existing story",
    description=(
        "Compares the incoming headline and text against the provided candidate "
        "stories. Returns the best match with a confidence score, or a null "
        "matched_story_id if no candidate clears the 0.60 threshold."
    ),
)
async def match(payload: ClusterRequest) -> ClusterResponse:
    try:
        return await cluster_match(
            headline=payload.headline,
            text=payload.text,
            story_candidates=payload.story_candidates,
        )
    except RuntimeError as exc:
        logger.exception("NLP service unavailable")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
