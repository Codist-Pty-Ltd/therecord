"""Unit tests for core.relevance."""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest

from config import get_settings
from core.relevance import (
    COLD_START_SCORE,
    RelevanceScore,
    is_relevant,
    score,
)
from tests.conftest import unit_vector


@pytest.mark.asyncio
async def test_score_orders_on_topic_above_off_topic() -> None:
    settings = get_settings()
    centroid = unit_vector(settings.embedding_dim, 0)

    async def fake_centroid() -> list[float]:
        return centroid

    def fake_embed(text: str) -> list[float]:
        if "zondo" in text.lower():
            return unit_vector(settings.embedding_dim, 0)
        return unit_vector(settings.embedding_dim, 1)

    with (
        patch("core.relevance.get_centroid", side_effect=fake_centroid),
        patch("core.relevance.embed_text", side_effect=fake_embed),
    ):
        on_topic = await score("Zondo commission hearing on state capture")
        off_topic = await score("Best pasta recipes for dinner")

    assert on_topic.method == "centroid_v1"
    assert off_topic.method == "centroid_v1"
    assert on_topic.score > off_topic.score
    assert on_topic.score == pytest.approx(1.0, abs=1e-5)
    assert off_topic.score == pytest.approx(0.0, abs=1e-5)


@pytest.mark.asyncio
async def test_score_cold_start_when_centroid_missing() -> None:
    with patch("core.relevance.get_centroid", AsyncMock(return_value=None)):
        result = await score("Any text")

    assert result.cold_start is True
    assert result.method == "centroid_v1_cold_start"
    assert result.score == COLD_START_SCORE
    assert is_relevant(result) is False


def test_is_relevant_uses_threshold_not_baked_into_score() -> None:
    settings = get_settings()
    above = RelevanceScore(
        score=settings.relevance_threshold + 0.01,
        method="centroid_v1",
        model=settings.embedding_model,
    )
    below = RelevanceScore(
        score=settings.relevance_threshold - 0.01,
        method="centroid_v1",
        model=settings.embedding_model,
    )
    assert is_relevant(above) is True
    assert is_relevant(below) is False
