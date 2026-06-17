"""Entity extraction and linking endpoints."""

from __future__ import annotations

import logging
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from core.linking import EntityType, LinkResult, link_mention, persist_link_candidate
from models.requests import ExtractEntitiesRequest
from models.responses import ExtractEntitiesResponse
from services.nlp_service import extract_entities

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/entities", tags=["entities"])


class LinkEntityRequest(BaseModel):
    mention: str = Field(min_length=1)
    entity_type: Literal["person", "commission", "organisation"]
    source_type: str | None = None
    source_id: UUID | None = None


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


@router.post(
    "/link",
    response_model=LinkResult,
    summary="Link a mention to a canonical Record entity",
)
async def link_entity(payload: LinkEntityRequest) -> LinkResult:
    mention = payload.mention.strip()
    if not mention:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="mention must not be empty",
        )

    entity_type: EntityType = payload.entity_type
    result = await link_mention(mention, entity_type)

    if not result.matched:
        try:
            await persist_link_candidate(
                mention=mention,
                entity_type=entity_type,
                source_type=payload.source_type,
                source_id=payload.source_id,
                result=result,
            )
        except Exception as exc:  # noqa: BLE001 — return link result even if queue write fails
            logger.warning("Failed to persist entity_link_candidate: %s", exc)

    return result
