"""Tests for Phase 2 relevance model wiring."""

from __future__ import annotations

import os
from unittest.mock import patch

import numpy as np
import pytest
from sklearn.linear_model import LogisticRegression

from config import get_settings
from core.relevance import RelevanceScore, score
from ml.relevance_features import RelevanceFeatureInput, build_feature_vector


@pytest.mark.asyncio
async def test_score_falls_back_to_centroid_when_model_missing(
    pgvector_database_url: str,
    pgvector_pool: None,
) -> None:
    get_settings.cache_clear()
    os.environ["RELEVANCE_STRATEGY"] = "model"
    os.environ.pop("RELEVANCE_MODEL_PATH", None)
    get_settings.cache_clear()

    with patch("core.relevance.get_centroid", return_value=[1.0] + [0.0] * 383):
        with patch("core.relevance.embed_text", return_value=[1.0] + [0.0] * 383):
            result = await score("Zondo commission hearing")

    assert result.method == "centroid_v1"
    assert result.cold_start is False


@pytest.mark.asyncio
async def test_score_uses_model_when_artifact_present(
    pgvector_database_url: str,
    pgvector_pool: None,
    tmp_path,
) -> None:
    import joblib

    payload_pos = RelevanceFeatureInput(
        text="Zondo commission hearing",
        centroid_score=0.8,
    )
    payload_neg = RelevanceFeatureInput(
        text="Cooking pasta recipes",
        centroid_score=0.1,
    )
    features_pos = build_feature_vector(payload_pos)
    features_neg = build_feature_vector(payload_neg)
    x = np.asarray([features_pos, features_neg], dtype=np.float32)
    y = np.asarray([1, 0], dtype=np.int8)
    model = LogisticRegression(max_iter=200)
    model.fit(x, y)

    artifact = tmp_path / "relevance_test.joblib"
    joblib.dump(
        {
            "model": model,
            "model_type": "logistic_regression",
            "version": "test123",
            "feature_spec": {},
        },
        artifact,
    )

    os.environ["RELEVANCE_STRATEGY"] = "model"
    os.environ["RELEVANCE_MODEL_PATH"] = str(artifact)
    get_settings.cache_clear()

    import core.relevance as relevance_mod

    relevance_mod._model_bundle = None

    with patch("core.relevance.get_centroid", return_value=[1.0] + [0.0] * 383):
        with patch("core.relevance.embed_text", return_value=list(features_pos[:384])):
            result = await score("Zondo commission hearing")

    assert result.method == "model_vtest123"
    assert isinstance(result, RelevanceScore)
    assert 0.0 <= result.score <= 1.0

    relevance_mod._model_bundle = None
    get_settings.cache_clear()
