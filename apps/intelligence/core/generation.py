"""Grounded answer generation over retrieved corpus chunks (Anthropic Claude)."""

from __future__ import annotations

import json
import logging
import re
from uuid import UUID

from anthropic import APIError, APIStatusError, RateLimitError
from pydantic import BaseModel, Field

from config import get_settings
from core.retrieval import RetrievedChunk
from services.claude_service import get_client

logger = logging.getLogger(__name__)

_REFUSAL_ANSWER = (
    "There is not enough sourced material in The Record corpus to answer "
    "that question reliably."
)

_JSON_BLOCK_RE = re.compile(r"\{[\s\S]*\}")


class GenerationError(Exception):
    """Raised when the Anthropic API fails during grounded generation."""


class Citation(BaseModel):
    """A corpus source referenced in a grounded answer."""

    source_type: str
    source_id: UUID
    chunk_index: int


class AnswerResult(BaseModel):
    """Grounded (or refused) answer with mapped citations."""

    answer: str
    grounded: bool
    citations: list[Citation] = Field(default_factory=list)


def _format_chunks(chunks: list[RetrievedChunk]) -> str:
    blocks: list[str] = []
    for index, chunk in enumerate(chunks):
        blocks.append(
            f"[{index}] (source_type={chunk.source_type}, "
            f"source_id={chunk.source_id}, chunk_index={chunk.chunk_index})\n"
            f"{chunk.content}",
        )
    return "\n\n".join(blocks)


def _parse_model_json(text: str) -> dict[str, object]:
    stripped = text.strip()
    try:
        parsed = json.loads(stripped)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass

    match = _JSON_BLOCK_RE.search(stripped)
    if match:
        parsed = json.loads(match.group(0))
        if isinstance(parsed, dict):
            return parsed

    raise ValueError("model response was not valid JSON")


def _map_citations(
    chunks: list[RetrievedChunk],
    indices: object,
) -> list[Citation]:
    if not isinstance(indices, list):
        return []

    citations: list[Citation] = []
    seen: set[tuple[str, UUID, int]] = set()
    for raw_index in indices:
        if not isinstance(raw_index, int):
            continue
        if raw_index < 0 or raw_index >= len(chunks):
            continue
        chunk = chunks[raw_index]
        key = (chunk.source_type, chunk.source_id, chunk.chunk_index)
        if key in seen:
            continue
        seen.add(key)
        citations.append(
            Citation(
                source_type=chunk.source_type,
                source_id=chunk.source_id,
                chunk_index=chunk.chunk_index,
            ),
        )
    return citations


async def answer(query: str, chunks: list[RetrievedChunk]) -> AnswerResult:
    """
    Generate a grounded answer from retrieved chunks only.

    Returns an honest refusal when there is no context or the model cannot
    answer from the supplied material.
    """
    if not chunks:
        logger.info("answer refused: no retrieved chunks")
        return AnswerResult(answer=_REFUSAL_ANSWER, grounded=False, citations=[])

    settings = get_settings()
    if not settings.anthropic_api_key:
        raise GenerationError("Anthropic API key is not configured")

    system_prompt = (
        "You answer questions about South African public accountability using "
        "ONLY the numbered context chunks supplied by the user. "
        "Never use outside knowledge. Never invent facts, dates, names, or citations. "
        "If the chunks do not contain enough information, set grounded to false, "
        "give a short honest explanation, and return an empty chunk_indices list. "
        "When grounded is true, chunk_indices must list every chunk index you relied on. "
        "Respond with ONLY valid JSON in this shape: "
        '{"answer": "...", "grounded": true|false, "chunk_indices": [0, 1]}'
    )

    user_prompt = (
        f"Question:\n{query.strip()}\n\n"
        f"Context chunks:\n{_format_chunks(chunks)}\n\n"
        "Return JSON only."
    )

    client = get_client()
    logger.info(
        "Claude grounded answer: query_chars=%s chunk_count=%s",
        len(query),
        len(chunks),
    )

    try:
        response = await client.messages.create(
            model=settings.anthropic_model,
            max_tokens=900,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
    except RateLimitError as exc:
        raise GenerationError("Anthropic rate limit exceeded") from exc
    except APIStatusError as exc:
        raise GenerationError(f"Anthropic API returned {exc.status_code}") from exc
    except APIError as exc:
        raise GenerationError("Anthropic API error") from exc

    parts: list[str] = []
    for block in response.content:
        block_text = getattr(block, "text", None)
        if isinstance(block_text, str):
            parts.append(block_text)
    raw = "".join(parts).strip()

    try:
        payload = _parse_model_json(raw)
    except (ValueError, json.JSONDecodeError) as exc:
        logger.warning("Claude answer JSON parse failed: %s", exc)
        return AnswerResult(answer=_REFUSAL_ANSWER, grounded=False, citations=[])

    answer_text = payload.get("answer")
    grounded = payload.get("grounded")
    if not isinstance(answer_text, str) or not answer_text.strip():
        return AnswerResult(answer=_REFUSAL_ANSWER, grounded=False, citations=[])

    if grounded is not True:
        return AnswerResult(
            answer=answer_text.strip(),
            grounded=False,
            citations=[],
        )

    citations = _map_citations(chunks, payload.get("chunk_indices"))
    if not citations:
        return AnswerResult(
            answer=_REFUSAL_ANSWER,
            grounded=False,
            citations=[],
        )

    return AnswerResult(
        answer=answer_text.strip(),
        grounded=True,
        citations=citations,
    )
