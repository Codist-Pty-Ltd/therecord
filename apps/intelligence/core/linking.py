"""Resolve extracted mentions to canonical Record entities (confidence-gated)."""

from __future__ import annotations

import logging
import re
import threading
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field
from rapidfuzz import fuzz

import db
from config import get_settings
from core.embeddings import embed_text

logger = logging.getLogger(__name__)

EntityType = Literal["person", "commission", "organisation"]

_WHITESPACE_RE = re.compile(r"\s+")
_MAX_CANDIDATES = 5
_STRING_WEIGHT = 0.45
_EMBED_WEIGHT = 0.55

_name_embedding_cache: dict[tuple[str, str, str], list[float]] = {}
_cache_lock = threading.Lock()


class LinkCandidate(BaseModel):
    id: UUID
    name: str
    score: float = Field(ge=0.0, le=1.0)


class LinkResult(BaseModel):
    mention: str
    matched: bool
    canonical_id: UUID | None = None
    canonical_name: str | None = None
    confidence: float = Field(ge=0.0, le=1.0)
    candidates: list[LinkCandidate] = Field(default_factory=list)


class CanonicalRow(BaseModel):
    id: UUID
    canonical_name: str
    aliases: list[str] = Field(default_factory=list)


def _normalise(text: str) -> str:
    return _WHITESPACE_RE.sub(" ", text.lower().strip())


def _candidate_strings(row: CanonicalRow) -> list[str]:
    values = [row.canonical_name, *row.aliases]
    return [value for value in values if value and value.strip()]


def _string_similarity(mention: str, candidate_text: str) -> float:
    return fuzz.token_set_ratio(_normalise(mention), _normalise(candidate_text)) / 100.0


def _embedding_similarity(mention: str, candidate_text: str) -> float:
    mention_vec = embed_text(mention)
    cache_key = ("candidate", candidate_text, candidate_text)
    with _cache_lock:
        cached = _name_embedding_cache.get(cache_key)
        if cached is None:
            cached = embed_text(candidate_text)
            _name_embedding_cache[cache_key] = cached
    candidate_vec = cached

    dot = sum(a * b for a, b in zip(mention_vec, candidate_vec, strict=True))
    mention_norm = sum(a * a for a in mention_vec) ** 0.5
    candidate_norm = sum(b * b for b in candidate_vec) ** 0.5
    if mention_norm == 0 or candidate_norm == 0:
        return 0.0
    cosine = dot / (mention_norm * candidate_norm)
    return max(0.0, min(1.0, cosine))


def _score_candidate(mention: str, row: CanonicalRow) -> float:
    string_scores = [_string_similarity(mention, text) for text in _candidate_strings(row)]
    embed_scores = [_embedding_similarity(mention, text) for text in _candidate_strings(row)]
    best_string = max(string_scores) if string_scores else 0.0
    best_embed = max(embed_scores) if embed_scores else 0.0
    return _STRING_WEIGHT * best_string + _EMBED_WEIGHT * best_embed


def rank_candidates(mention: str, rows: list[CanonicalRow]) -> LinkResult:
    """Score in-memory canonical rows and apply the confidence threshold."""
    settings = get_settings()
    threshold = settings.link_confidence_threshold
    normalised_mention = mention.strip()
    if not normalised_mention or not rows:
        return LinkResult(
            mention=normalised_mention,
            matched=False,
            confidence=0.0,
            candidates=[],
        )

    scored: list[tuple[CanonicalRow, float]] = []
    for row in rows:
        scored.append((row, _score_candidate(normalised_mention, row)))

    scored.sort(key=lambda item: item[1], reverse=True)
    top = scored[0]
    top_row, top_score = top

    candidates = [
        LinkCandidate(id=row.id, name=row.canonical_name, score=round(score, 4))
        for row, score in scored[:_MAX_CANDIDATES]
    ]

    if top_score >= threshold:
        return LinkResult(
            mention=normalised_mention,
            matched=True,
            canonical_id=top_row.id,
            canonical_name=top_row.canonical_name,
            confidence=round(top_score, 4),
            candidates=candidates,
        )

    return LinkResult(
        mention=normalised_mention,
        matched=False,
        confidence=round(top_score, 4),
        candidates=candidates,
    )


async def _fetch_candidates(entity_type: EntityType) -> list[CanonicalRow]:
    if entity_type == "person":
        sql = """
            SELECT id, full_name, aliases
            FROM people
            ORDER BY full_name
        """
    elif entity_type == "commission":
        sql = """
            SELECT id, popular_name, ARRAY[full_name]::text[] AS aliases
            FROM commissions
            ORDER BY popular_name
        """
    else:
        sql = """
            SELECT id, name AS canonical_name,
                   ARRAY[popular_name, abbreviation]::text[] AS aliases
            FROM (
                SELECT id, name, popular_name, abbreviation
                FROM accountability_bodies
                UNION ALL
                SELECT id, name, popular_name, abbreviation
                FROM state_entities
            ) organisations
            ORDER BY canonical_name
        """

    rows = await db.fetch(sql)
    candidates: list[CanonicalRow] = []
    for row in rows:
        row_id = row[0]
        canonical_name = str(row[1])
        raw_aliases = row[2] if len(row) > 2 else []
        aliases = [str(alias) for alias in (raw_aliases or []) if alias]
        candidates.append(
            CanonicalRow(id=row_id, canonical_name=canonical_name, aliases=aliases),
        )
    return candidates


async def link_mention(mention: str, entity_type: EntityType) -> LinkResult:
    """Link a mention to a canonical row when confidence clears the threshold."""
    candidates = await _fetch_candidates(entity_type)
    result = rank_candidates(mention, candidates)
    logger.info(
        "link_mention type=%s matched=%s confidence=%.3f candidates=%s",
        entity_type,
        result.matched,
        result.confidence,
        len(result.candidates),
    )
    return result


async def persist_link_candidate(
    *,
    mention: str,
    entity_type: EntityType,
    source_type: str | None,
    source_id: UUID | None,
    result: LinkResult,
) -> None:
    """Queue a low-confidence mention for human review."""
    top = result.candidates[0] if result.candidates else None
    await db.execute(
        """
        INSERT INTO entity_link_candidate (
            mention, entity_type, source_type, source_id,
            suggested_id, suggested_name, confidence, status
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, 'pending')
        """,
        (
            mention,
            entity_type,
            source_type,
            source_id,
            top.id if top else None,
            top.name if top else None,
            result.confidence,
        ),
    )
