"""Tests for YouTube discover relevance integration."""

from __future__ import annotations

import os
from collections.abc import Iterator
from datetime import UTC, datetime
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from config import get_settings
from core.relevance import RelevanceScore
from tests.conftest import apply_intelligence_migrations, to_psycopg_url


@pytest.fixture()
def youtube_client() -> Iterator[TestClient]:
    from testcontainers.postgres import PostgresContainer

    with PostgresContainer("pgvector/pgvector:pg16") as postgres:
        database_url = to_psycopg_url(postgres.get_connection_url())
        apply_intelligence_migrations(database_url)

        os.environ["DATABASE_URL"] = database_url
        os.environ["APP_ENV"] = "dev"
        os.environ["YOUTUBE_API_KEY"] = "test-youtube-key"

        get_settings.cache_clear()

        from main import app

        with patch("main.get_nlp"):
            with TestClient(app) as client:
                yield client

        get_settings.cache_clear()


def _video_item(video_id: str, title: str) -> dict[str, object]:
    return {
        "id": video_id,
        "snippet": {
            "title": title,
            "channelId": "UCtestchannel",
            "channelTitle": "SABC News",
            "description": "Commission hearing coverage.",
            "publishedAt": datetime(2021, 3, 1, tzinfo=UTC).isoformat().replace("+00:00", "Z"),
            "thumbnails": {"medium": {"url": "https://example.com/thumb.jpg"}},
        },
        "contentDetails": {"duration": "PT15M"},
        "statistics": {"viewCount": "50000"},
    }


def test_youtube_discover_uses_centroid_score_and_persists_label(
    youtube_client: TestClient,
) -> None:
    settings = get_settings()

    async def fake_score(_text: str) -> RelevanceScore:
        return RelevanceScore(
            score=0.88,
            method="centroid_v1",
            model=settings.embedding_model,
        )

    with (
        patch("routers.youtube._search_videos", return_value=["vid-centroid"]),
        patch("routers.youtube._videos_details", return_value=[_video_item("vid-centroid", "Zondo commission hearing")]),
        patch("routers.youtube._channels_subscribers", return_value={"UCtestchannel": 200_000}),
        patch("routers.youtube.relevance_score", side_effect=fake_score),
    ):
        response = youtube_client.post(
            "/api/youtube/discover",
            json={
                "entity_type": "commission",
                "entity_id": "00000000-0000-0000-0000-000000000001",
                "entity_name": "Zondo Commission",
                "search_queries": ["zondo commission"],
            },
        )

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["youtube_id"] == "vid-centroid"
    assert body[0]["relevance_score"] == pytest.approx(0.88)
    assert body[0]["scoring_method"] == "centroid_v1"
    assert body[0]["heuristic_score"] is not None


def test_youtube_discover_falls_back_to_heuristic_when_cold_start(
    youtube_client: TestClient,
) -> None:
    settings = get_settings()

    async def fake_score(_text: str) -> RelevanceScore:
        return RelevanceScore(
            score=0.5,
            method="centroid_v1_cold_start",
            model=settings.embedding_model,
            cold_start=True,
        )

    with (
        patch("routers.youtube._search_videos", return_value=["vid-heuristic"]),
        patch(
            "routers.youtube._videos_details",
            return_value=[_video_item("vid-heuristic", "Zondo commission hearing testimony")],
        ),
        patch("routers.youtube._channels_subscribers", return_value={"UCtestchannel": 200_000}),
        patch("routers.youtube.relevance_score", side_effect=fake_score),
    ):
        response = youtube_client.post(
            "/api/youtube/discover",
            json={
                "entity_type": "commission",
                "entity_id": "00000000-0000-0000-0000-000000000002",
                "entity_name": "Zondo Commission",
                "search_queries": ["zondo commission"],
            },
        )

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["scoring_method"] == "heuristic_fallback"
    assert body[0]["relevance_score"] == body[0]["heuristic_score"]
