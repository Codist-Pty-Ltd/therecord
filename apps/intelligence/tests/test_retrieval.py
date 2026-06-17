"""Integration tests for core.retrieval."""

from __future__ import annotations

from unittest.mock import patch
from uuid import uuid4

import pytest

from config import get_settings
from core.retrieval import retrieve
from tests.conftest import insert_doc_chunk, unit_vector


@pytest.mark.asyncio
async def test_retrieve_ranks_matching_chunk_first(
    pgvector_database_url: str,
    pgvector_pool: None,
) -> None:
    settings = get_settings()
    source_a = uuid4()
    source_b = uuid4()
    query_vector = unit_vector(settings.embedding_dim, 0)
    other_vector = unit_vector(settings.embedding_dim, 1)

    insert_doc_chunk(
        pgvector_database_url,
        source_type="story",
        source_id=source_b,
        chunk_index=0,
        content="Unrelated commission report summary.",
        embedding=other_vector,
    )
    insert_doc_chunk(
        pgvector_database_url,
        source_type="story",
        source_id=source_a,
        chunk_index=0,
        content="State capture commission findings on procurement.",
        embedding=query_vector,
    )

    with patch("core.retrieval.embed_text", return_value=query_vector):
        results = await retrieve("state capture commission", top_k=5)

    assert len(results) >= 1
    assert results[0].source_id == source_a
    assert results[0].similarity == pytest.approx(1.0, abs=1e-5)


@pytest.mark.asyncio
async def test_retrieve_respects_min_similarity(
    pgvector_database_url: str,
    pgvector_pool: None,
) -> None:
    settings = get_settings()
    source_id = uuid4()
    query_vector = unit_vector(settings.embedding_dim, 0)
    distant_vector = unit_vector(settings.embedding_dim, 2)

    insert_doc_chunk(
        pgvector_database_url,
        source_type="commission",
        source_id=source_id,
        chunk_index=0,
        content="Distant topic.",
        embedding=distant_vector,
    )

    with patch("core.retrieval.embed_text", return_value=query_vector):
        results = await retrieve("query", top_k=5, min_similarity=0.9)

    assert results == []


@pytest.mark.asyncio
async def test_retrieve_filters_by_source_type(
    pgvector_database_url: str,
    pgvector_pool: None,
) -> None:
    settings = get_settings()
    story_id = uuid4()
    person_id = uuid4()
    query_vector = unit_vector(settings.embedding_dim, 0)

    insert_doc_chunk(
        pgvector_database_url,
        source_type="story",
        source_id=story_id,
        chunk_index=0,
        content="Story chunk.",
        embedding=query_vector,
    )
    insert_doc_chunk(
        pgvector_database_url,
        source_type="person",
        source_id=person_id,
        chunk_index=0,
        content="Person chunk.",
        embedding=query_vector,
    )

    with patch("core.retrieval.embed_text", return_value=query_vector):
        results = await retrieve("query", source_types=["person"])

    assert len(results) == 1
    assert results[0].source_type == "person"
    assert results[0].source_id == person_id
