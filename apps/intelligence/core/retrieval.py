"""Vector retrieval over indexed doc_chunk rows."""

from __future__ import annotations

import logging
from uuid import UUID

import db
from pydantic import BaseModel, Field

from config import get_settings
from core.embeddings import embed_text

logger = logging.getLogger(__name__)


class RetrievedChunk(BaseModel):
    """A ranked chunk from the accountability corpus."""

    chunk_id: UUID
    source_type: str
    source_id: UUID
    chunk_index: int
    content: str
    similarity: float = Field(ge=0.0, le=1.0)


async def retrieve(
    query: str,
    *,
    top_k: int | None = None,
    min_similarity: float | None = None,
    source_types: list[str] | None = None,
) -> list[RetrievedChunk]:
    """Embed the query and return top-k chunks by cosine similarity."""
    settings = get_settings()
    k = top_k if top_k is not None else settings.rag_top_k
    floor = min_similarity if min_similarity is not None else settings.rag_min_similarity

    query_vector = embed_text(query.strip())

    sql = """
        SELECT
            id,
            source_type,
            source_id,
            chunk_index,
            content,
            1 - (embedding <=> %s::vector) AS similarity
        FROM doc_chunk
        WHERE embedding IS NOT NULL
    """
    params: list[object] = [query_vector]

    if source_types:
        sql += " AND source_type = ANY(%s)"
        params.append(source_types)

    sql += """
        ORDER BY embedding <=> %s::vector
        LIMIT %s
    """
    params.extend([query_vector, k])

    rows = await db.fetch(sql, params)
    results: list[RetrievedChunk] = []
    for row in rows:
        similarity = float(row[5])
        if similarity < floor:
            continue
        results.append(
            RetrievedChunk(
                chunk_id=row[0],
                source_type=row[1],
                source_id=row[2],
                chunk_index=row[3],
                content=row[4],
                similarity=similarity,
            ),
        )

    logger.debug(
        "retrieve query_len=%s returned=%s floor=%.3f",
        len(query),
        len(results),
        floor,
    )
    return results
