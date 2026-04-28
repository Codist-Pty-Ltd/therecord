"""Entity extraction endpoints."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status

from models.requests import ExtractEntitiesRequest
from models.responses import ExtractEntitiesResponse
from services.nlp_service import extract_entities

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/entities", tags=["entities"])


@router.post(
    "/extract",
    response_model=ExtractEntitiesResponse,
    summary="Extract named entities from free text",
    description=(
        "Runs spaCy NER over the incoming text and returns structured people, "
        "organisations, events, locations, and a keyword-matched list of alleged crimes."
    ),
)
async def extract(payload: ExtractEntitiesRequest) -> ExtractEntitiesResponse:
    try:
        return await extract_entities(payload.text)
    except RuntimeError as exc:
        logger.exception("NLP service unavailable")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
