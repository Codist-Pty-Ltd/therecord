"""Integration tests for POST /api/entities/link."""

from __future__ import annotations

import os
from collections.abc import Iterator
from unittest.mock import patch
from uuid import uuid4

import psycopg
import pytest
from fastapi.testclient import TestClient

from config import get_settings
from core.linking import LinkCandidate, LinkResult
from tests.conftest import apply_intelligence_migrations, to_psycopg_url


@pytest.fixture()
def entities_client() -> Iterator[TestClient]:
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


def test_entities_link_queues_low_confidence_mention(entities_client: TestClient) -> None:
    suggested_id = uuid4()

    async def fake_link(_mention: str, _entity_type: str) -> LinkResult:
        return LinkResult(
            mention="Mystery Official",
            matched=False,
            confidence=0.41,
            candidates=[
                LinkCandidate(id=suggested_id, name="Unknown Person", score=0.41),
            ],
        )

    with patch("routers.entities.link_mention", side_effect=fake_link):
        response = entities_client.post(
            "/api/entities/link",
            json={
                "mention": "Mystery Official",
                "entity_type": "person",
                "source_type": "story",
                "source_id": str(uuid4()),
            },
        )

    assert response.status_code == 200
    body = response.json()
    assert body["matched"] is False
    assert body["confidence"] == pytest.approx(0.41)

    database_url = os.environ["DATABASE_URL"]
    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT mention, status, suggested_id::text FROM entity_link_candidate",
            )
            row = cur.fetchone()
    assert row is not None
    assert row[0] == "Mystery Official"
    assert row[1] == "pending"
    assert row[2] == str(suggested_id)


def test_entities_link_does_not_queue_high_confidence_match(entities_client: TestClient) -> None:
    canonical_id = uuid4()

    async def fake_link(_mention: str, _entity_type: str) -> LinkResult:
        return LinkResult(
            mention="President Ramaphosa",
            matched=True,
            canonical_id=canonical_id,
            canonical_name="Cyril Ramaphosa",
            confidence=0.91,
            candidates=[],
        )

    with patch("routers.entities.link_mention", side_effect=fake_link):
        response = entities_client.post(
            "/api/entities/link",
            json={"mention": "President Ramaphosa", "entity_type": "person"},
        )

    assert response.status_code == 200
    assert response.json()["matched"] is True
    assert response.json()["canonical_id"] == str(canonical_id)

    database_url = os.environ["DATABASE_URL"]
    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM entity_link_candidate")
            count_row = cur.fetchone()
    assert count_row is not None
    assert count_row[0] == 0
