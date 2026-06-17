"""Integration tests for POST /api/relevance/score."""

from __future__ import annotations

import os
from collections.abc import Iterator
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from config import get_settings
from core.relevance import RelevanceScore
from tests.conftest import apply_intelligence_migrations, to_psycopg_url


@pytest.fixture()
def relevance_client() -> Iterator[TestClient]:
    from testcontainers.postgres import PostgresContainer

    with PostgresContainer("pgvector/pgvector:pg16") as postgres:
        database_url = to_psycopg_url(postgres.get_connection_url())
        apply_intelligence_migrations(database_url)

        os.environ["DATABASE_URL"] = database_url
        os.environ["APP_ENV"] = "dev"

        get_settings.cache_clear()

        from main import app

        with patch("main.get_nlp"):
            with TestClient(app) as client:
                yield client

        get_settings.cache_clear()


def test_relevance_score_response_shape(relevance_client: TestClient) -> None:
    settings = get_settings()

    async def fake_score(_text: str) -> RelevanceScore:
        return RelevanceScore(
            score=0.72,
            method="centroid_v1",
            model=settings.embedding_model,
        )

    with patch("routers.relevance.score", side_effect=fake_score):
        response = relevance_client.post(
            "/api/relevance/score",
            json={"text": "Zondo commission testimony"},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["score"] == pytest.approx(0.72)
    assert body["method"] == "centroid_v1"
    assert body["model"] == settings.embedding_model
    assert body["threshold"] == settings.relevance_threshold
    assert body["relevant"] is True
    assert body["cold_start"] is False


def test_relevance_score_marks_not_relevant_below_threshold(
    relevance_client: TestClient,
) -> None:
    settings = get_settings()

    async def fake_score(_text: str) -> RelevanceScore:
        return RelevanceScore(
            score=0.1,
            method="centroid_v1",
            model=settings.embedding_model,
        )

    with patch("routers.relevance.score", side_effect=fake_score):
        response = relevance_client.post(
            "/api/relevance/score",
            json={"text": "Off-topic cooking video"},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["relevant"] is False
    assert body["score"] < body["threshold"]
