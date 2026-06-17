"""Integration tests for POST /api/rag/query."""

from __future__ import annotations

import os
from collections.abc import Iterator
from unittest.mock import patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from config import get_settings
from tests.conftest import apply_doc_chunk_migration, insert_doc_chunk, to_psycopg_url, unit_vector


@pytest.fixture()
def rag_client() -> Iterator[tuple[TestClient, str]]:
    from testcontainers.postgres import PostgresContainer

    with PostgresContainer("pgvector/pgvector:pg16") as postgres:
        database_url = to_psycopg_url(postgres.get_connection_url())
        apply_doc_chunk_migration(database_url)

        os.environ["DATABASE_URL"] = database_url
        os.environ["APP_ENV"] = "dev"

        get_settings.cache_clear()

        from main import app

        with patch("main.get_nlp"):
            with TestClient(app) as client:
                yield client, database_url

        get_settings.cache_clear()


def test_rag_query_returns_ranked_chunks(rag_client: tuple[TestClient, str]) -> None:
    client, database_url = rag_client
    settings = get_settings()
    source_id = uuid4()
    query_vector = unit_vector(settings.embedding_dim, 0)
    other_vector = unit_vector(settings.embedding_dim, 3)

    insert_doc_chunk(
        database_url,
        source_type="story",
        source_id=uuid4(),
        chunk_index=0,
        content="Noise chunk.",
        embedding=other_vector,
    )
    insert_doc_chunk(
        database_url,
        source_type="story",
        source_id=source_id,
        chunk_index=0,
        content="Zondo commission testimony on state capture.",
        embedding=query_vector,
    )

    with patch("core.retrieval.embed_text", return_value=query_vector):
        response = client.post(
            "/api/rag/query",
            json={"query": "Zondo commission testimony", "top_k": 3},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["query"] == "Zondo commission testimony"
    assert len(body["results"]) >= 1
    assert body["results"][0]["source_id"] == str(source_id)
    assert body["results"][0]["source_type"] == "story"


def test_rag_query_empty_results_when_below_floor(
    rag_client: tuple[TestClient, str],
) -> None:
    client, database_url = rag_client
    settings = get_settings()
    query_vector = unit_vector(settings.embedding_dim, 0)
    distant_vector = unit_vector(settings.embedding_dim, 4)

    insert_doc_chunk(
        database_url,
        source_type="story",
        source_id=uuid4(),
        chunk_index=0,
        content="Unrelated.",
        embedding=distant_vector,
    )

    with patch("core.retrieval.embed_text", return_value=query_vector):
        response = client.post(
            "/api/rag/query",
            json={"query": "query", "min_similarity": 0.99},
        )

    assert response.status_code == 200
    assert response.json()["results"] == []


def test_rag_query_rejects_empty_query(rag_client: tuple[TestClient, str]) -> None:
    client, _database_url = rag_client
    response = client.post("/api/rag/query", json={"query": "   "})
    assert response.status_code == 422
