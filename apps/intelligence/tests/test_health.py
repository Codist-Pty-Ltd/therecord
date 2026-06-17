"""Health endpoint integration test with Postgres + pgvector."""

from __future__ import annotations

import os
from collections.abc import Iterator
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from testcontainers.postgres import PostgresContainer

from tests.conftest import apply_doc_chunk_migration, to_psycopg_url


@pytest.fixture()
def health_client() -> Iterator[TestClient]:
    with PostgresContainer("pgvector/pgvector:pg16") as postgres:
        database_url = to_psycopg_url(postgres.get_connection_url())
        apply_doc_chunk_migration(database_url)

        os.environ["DATABASE_URL"] = database_url
        os.environ["APP_ENV"] = "dev"

        from config import get_settings

        get_settings.cache_clear()

        from main import app

        with patch("main.get_nlp"):
            with TestClient(app) as client:
                yield client


def test_health_returns_ok_with_pgvector(health_client: TestClient) -> None:
    response = health_client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["db"] == "ok"
    assert body["pgvector"] is True
    assert body["app_env"] == "dev"
