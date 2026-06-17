"""Integration tests for POST /api/rag/ask."""

from __future__ import annotations

import json
import os
from collections.abc import Iterator
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from config import get_settings
from core.generation import GenerationError
from tests.conftest import apply_doc_chunk_migration, insert_doc_chunk, to_psycopg_url, unit_vector


def _anthropic_response(payload: dict[str, object]) -> SimpleNamespace:
    return SimpleNamespace(content=[SimpleNamespace(text=json.dumps(payload))])


@pytest.fixture()
def rag_ask_client() -> Iterator[tuple[TestClient, str]]:
    from testcontainers.postgres import PostgresContainer

    with PostgresContainer("pgvector/pgvector:pg16") as postgres:
        database_url = to_psycopg_url(postgres.get_connection_url())
        apply_doc_chunk_migration(database_url)

        os.environ["DATABASE_URL"] = database_url
        os.environ["APP_ENV"] = "dev"
        os.environ["ANTHROPIC_API_KEY"] = "test-key"

        get_settings.cache_clear()

        from main import app

        with patch("main.get_nlp"):
            with TestClient(app) as client:
                yield client, database_url

        get_settings.cache_clear()


def test_rag_ask_grounded_returns_mapped_citations(
    rag_ask_client: tuple[TestClient, str],
) -> None:
    client, database_url = rag_ask_client
    settings = get_settings()
    source_id = uuid4()
    query_vector = unit_vector(settings.embedding_dim, 0)

    insert_doc_chunk(
        database_url,
        source_type="story",
        source_id=source_id,
        chunk_index=0,
        content="The Zondo Commission found systemic state capture in procurement.",
        embedding=query_vector,
    )

    mock_create = AsyncMock(
        return_value=_anthropic_response(
            {
                "answer": "The Zondo Commission found systemic state capture.",
                "grounded": True,
                "chunk_indices": [0],
            },
        ),
    )

    with (
        patch("core.retrieval.embed_text", return_value=query_vector),
        patch("core.generation.get_client") as mock_get_client,
    ):
        mock_get_client.return_value = SimpleNamespace(messages=SimpleNamespace(create=mock_create))
        response = client.post(
            "/api/rag/ask",
            json={"query": "What did the Zondo Commission find?"},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["grounded"] is True
    assert body["citations"] == [
        {
            "source_type": "story",
            "source_id": str(source_id),
            "chunk_index": 0,
        },
    ]
    assert body["sources"][0]["source_id"] == str(source_id)
    mock_create.assert_awaited_once()


def test_rag_ask_empty_retrieval_returns_ungrounded_refusal(
    rag_ask_client: tuple[TestClient, str],
) -> None:
    client, database_url = rag_ask_client
    settings = get_settings()
    query_vector = unit_vector(settings.embedding_dim, 0)
    distant_vector = unit_vector(settings.embedding_dim, 5)

    insert_doc_chunk(
        database_url,
        source_type="story",
        source_id=uuid4(),
        chunk_index=0,
        content="Unrelated topic.",
        embedding=distant_vector,
    )

    with patch("core.retrieval.embed_text", return_value=query_vector):
        response = client.post(
            "/api/rag/ask",
            json={"query": "Unrelated question", "min_similarity": 0.99},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["grounded"] is False
    assert body["citations"] == []
    assert body["sources"] == []
    assert "not enough sourced material" in body["answer"].lower()


def test_rag_ask_generation_failure_returns_502(
    rag_ask_client: tuple[TestClient, str],
) -> None:
    client, database_url = rag_ask_client
    settings = get_settings()
    query_vector = unit_vector(settings.embedding_dim, 0)

    insert_doc_chunk(
        database_url,
        source_type="story",
        source_id=uuid4(),
        chunk_index=0,
        content="Some indexed content.",
        embedding=query_vector,
    )

    with (
        patch("core.retrieval.embed_text", return_value=query_vector),
        patch("routers.rag.answer", side_effect=GenerationError("upstream down")),
    ):
        response = client.post(
            "/api/rag/ask",
            json={"query": "Question"},
        )

    assert response.status_code == 502
