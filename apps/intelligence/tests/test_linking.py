"""Unit tests for core.linking."""

from __future__ import annotations

from unittest.mock import patch
from uuid import uuid4

from config import get_settings
from core.linking import CanonicalRow, rank_candidates


def test_rank_candidates_matches_high_confidence_mention() -> None:
    person_id = uuid4()
    rows = [
        CanonicalRow(
            id=person_id,
            canonical_name="Cyril Ramaphosa",
            aliases=["President Ramaphosa", "Ramaphosa"],
        ),
        CanonicalRow(
            id=uuid4(),
            canonical_name="Jacob Zuma",
            aliases=["Zuma"],
        ),
    ]

    with patch("core.linking._embedding_similarity", return_value=0.95):
        result = rank_candidates("President Ramaphosa", rows)

    settings = get_settings()
    assert result.matched is True
    assert result.canonical_id == person_id
    assert result.confidence >= settings.link_confidence_threshold


def test_rank_candidates_returns_low_confidence_for_unknown_name() -> None:
    rows = [
        CanonicalRow(
            id=uuid4(),
            canonical_name="Cyril Ramaphosa",
            aliases=["Ramaphosa"],
        ),
    ]

    with patch("core.linking._embedding_similarity", return_value=0.1):
        with patch("core.linking._string_similarity", return_value=0.2):
            result = rank_candidates("Completely Unknown Person", rows)

    settings = get_settings()
    assert result.matched is False
    assert result.confidence < settings.link_confidence_threshold
    assert len(result.candidates) == 1


def test_rank_candidates_orders_better_match_first() -> None:
    good_id = uuid4()
    weak_id = uuid4()
    rows = [
        CanonicalRow(id=weak_id, canonical_name="National Treasury", aliases=[]),
        CanonicalRow(id=good_id, canonical_name="Zondo Commission", aliases=["State Capture Commission"]),
    ]

    def fake_string(mention: str, candidate: str) -> float:
        if "zondo" in candidate.lower():
            return 0.95
        return 0.2

    with patch("core.linking._embedding_similarity", return_value=0.5):
        with patch("core.linking._string_similarity", side_effect=fake_string):
            result = rank_candidates("Zondo commission hearing", rows)

    assert result.candidates[0].id == good_id
    assert result.candidates[0].score >= result.candidates[1].score
