"""Evaluate Phase 2 relevance model against the centroid baseline."""

from __future__ import annotations

import argparse
import asyncio
import logging
from pathlib import Path

import db
import joblib
import numpy as np
from sklearn.metrics import (
    average_precision_score,
    confusion_matrix,
    precision_score,
    recall_score,
    roc_auc_score,
)

from ml.relevance_features import RelevanceFeatureInput, build_feature_vector

logger = logging.getLogger(__name__)


def _precision_at_k(scores: np.ndarray, labels: np.ndarray, k: int) -> float:
    if len(scores) == 0:
        return 0.0
    order = np.argsort(scores)[::-1][:k]
    selected = labels[order]
    return float(selected.sum() / min(k, len(selected)))


async def _load_rows() -> list[tuple[RelevanceFeatureInput, bool, float]]:
    rows = await db.fetch(
        """
        SELECT text, title, channel, heuristic_score, score, human_label
        FROM relevance_label
        WHERE human_label IS NOT NULL
        ORDER BY created_at ASC
        """,
    )
    payload: list[tuple[RelevanceFeatureInput, bool, float]] = []
    for row in rows:
        payload.append(
            (
                RelevanceFeatureInput(
                    text=str(row[0]),
                    title=row[1],
                    channel=row[2],
                    heuristic_score=float(row[3]) if row[3] is not None else None,
                    centroid_score=float(row[4]),
                ),
                bool(row[5]),
                float(row[4]),
            ),
        )
    return payload


def _predict_model(bundle: dict[str, object], features: np.ndarray) -> np.ndarray:
    model = bundle["model"]
    if hasattr(model, "predict_proba"):
        return np.asarray(model.predict_proba(features))[:, 1]  # type: ignore[attr-defined]
    raw = np.asarray(model.decision_function(features))  # type: ignore[attr-defined]
    return 1.0 / (1.0 + np.exp(-raw))


async def run_eval(*, artifact_path: Path, threshold: float) -> None:
    await db.open_pool()
    try:
        rows = await _load_rows()
        if len(rows) < 4:
            raise RuntimeError("Need at least 4 labelled rows for evaluation")

        split_at = max(1, int(len(rows) * 0.8))
        train_rows = rows[:split_at]
        test_rows = rows[split_at:] or rows[-1:]
        del train_rows  # train split reserved for future time-based workflows

        labels = np.asarray([label for _payload, label, _centroid in test_rows], dtype=np.int8)
        centroid_scores = np.asarray([centroid for _payload, _label, centroid in test_rows])
        features = np.vstack([build_feature_vector(payload) for payload, _label, _centroid in test_rows])

        bundle = joblib.load(artifact_path)
        model_scores = _predict_model(bundle, features)

        baseline = {
            "pr_auc": average_precision_score(labels, centroid_scores),
            "roc_auc": roc_auc_score(labels, centroid_scores),
            "precision@5": _precision_at_k(centroid_scores, labels, 5),
        }
        model_metrics = {
            "pr_auc": average_precision_score(labels, model_scores),
            "roc_auc": roc_auc_score(labels, model_scores),
            "precision@5": _precision_at_k(model_scores, labels, 5),
        }
        predictions = (model_scores >= threshold).astype(np.int8)
        matrix = confusion_matrix(labels, predictions)

        print("Relevance evaluation (held-out tail)")
        print(f"{'metric':<16} {'centroid_v1':>12} {'phase2_model':>12}")
        for key in ("pr_auc", "roc_auc", "precision@5"):
            print(f"{key:<16} {baseline[key]:>12.4f} {model_metrics[key]:>12.4f}")
        print(f"\nThreshold={threshold:.2f}")
        print(f"Precision={precision_score(labels, predictions, zero_division=0):.4f}")
        print(f"Recall={recall_score(labels, predictions, zero_division=0):.4f}")
        print("Confusion matrix [[tn fp][fn tp]]:")
        print(matrix)
    finally:
        await db.close_pool()


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    parser = argparse.ArgumentParser(description="Evaluate Phase 2 relevance model")
    parser.add_argument("artifact", type=Path, help="Path to relevance_*.joblib")
    parser.add_argument("--threshold", type=float, default=0.5)
    args = parser.parse_args()
    asyncio.run(run_eval(artifact_path=args.artifact, threshold=args.threshold))


if __name__ == "__main__":
    main()
