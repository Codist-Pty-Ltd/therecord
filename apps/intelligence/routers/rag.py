"""RAG retrieval and grounded Q&A endpoints."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from core.generation import AnswerResult, Citation, GenerationError, answer
from core.retrieval import RetrievedChunk, retrieve

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/rag", tags=["rag"])

MAX_TOP_K = 20


class RagQueryRequest(BaseModel):
    query: str = Field(min_length=1)
    top_k: int | None = Field(default=None, ge=1, le=MAX_TOP_K)
    min_similarity: float | None = Field(default=None, ge=0.0, le=1.0)
    source_types: list[str] | None = None


class RagQueryResponse(BaseModel):
    query: str
    results: list[RetrievedChunk]


class RagAskRequest(BaseModel):
    query: str = Field(min_length=1)
    top_k: int | None = Field(default=None, ge=1, le=MAX_TOP_K)
    min_similarity: float | None = Field(default=None, ge=0.0, le=1.0)
    source_types: list[str] | None = None


class RagAskResponse(BaseModel):
    query: str
    answer: str
    grounded: bool
    citations: list[Citation]
    sources: list[RetrievedChunk]


def _normalise_query(query: str) -> str:
    normalised = query.strip()
    if not normalised:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="query must not be empty",
        )
    return normalised


def _clamp_top_k(top_k: int | None) -> int:
    value = top_k if top_k is not None else min(MAX_TOP_K, 6)
    return min(value, MAX_TOP_K)


@router.post(
    "/query",
    response_model=RagQueryResponse,
    summary="Retrieve ranked corpus chunks for a query",
)
async def rag_query(payload: RagQueryRequest) -> RagQueryResponse:
    query = _normalise_query(payload.query)
    results = await retrieve(
        query,
        top_k=_clamp_top_k(payload.top_k),
        min_similarity=payload.min_similarity,
        source_types=payload.source_types,
    )
    return RagQueryResponse(query=query, results=results)


@router.post(
    "/ask",
    response_model=RagAskResponse,
    summary="Retrieve corpus chunks and generate a grounded answer",
)
async def rag_ask(payload: RagAskRequest) -> RagAskResponse:
    query = _normalise_query(payload.query)
    sources = await retrieve(
        query,
        top_k=_clamp_top_k(payload.top_k),
        min_similarity=payload.min_similarity,
        source_types=payload.source_types,
    )

    try:
        result: AnswerResult = await answer(query, sources)
    except GenerationError as exc:
        logger.warning("RAG generation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Answer generation is temporarily unavailable",
        ) from exc

    return RagAskResponse(
        query=query,
        answer=result.answer,
        grounded=result.grounded,
        citations=result.citations,
        sources=sources,
    )
