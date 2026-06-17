"""Smoke tests for Phase 2 relevance training."""

from __future__ import annotations

from pathlib import Path

import numpy as np

from ml.relevance_features import RelevanceFeatureInput, build_feature_vector
from ml.train_relevance import _train_classifier


def test_train_classifier_smoke_on_synthetic_features(tmp_path: Path) -> None:
    rows = []
    labels = []
    for index in range(6):
        label = index % 2 == 0
        payload = RelevanceFeatureInput(
            text=f"Sample accountability text {index}",
            title=f"Title {index}",
            channel="SABC News" if label else "Random Channel",
            heuristic_score=0.8 if label else 0.2,
            centroid_score=0.7 if label else 0.1,
        )
        rows.append(build_feature_vector(payload))
        labels.append(label)

    features = np.vstack(rows)
    y = np.asarray(labels, dtype=np.int8)
    model, model_type = _train_classifier(features, y)
    assert model_type in {"lightgbm", "logistic_regression"}

    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba(features)[:, 1]  # type: ignore[attr-defined]
    else:
        probabilities = model.predict_proba(features)[:, 1]  # type: ignore[attr-defined]

    assert probabilities.shape[0] == len(labels)
    assert np.all((probabilities >= 0.0) & (probabilities <= 1.0))
