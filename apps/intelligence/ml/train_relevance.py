"""Train a Phase 2 relevance classifier from labelled rows."""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
from datetime import UTC, datetime
from pathlib import Path

import db
import joblib
import numpy as np
from sklearn.linear_model import LogisticRegression

from ml.relevance_features import RelevanceFeatureInput, build_feature_vector, feature_spec

logger = logging.getLogger(__name__)

ARTIFACTS_DIR = Path(__file__).resolve().parent / "artifacts"


def _try_import_lightgbm() -> type | None:
    try:
        from lightgbm import LGBMClassifier

        return LGBMClassifier
    except ImportError:
        return None


async def _load_labelled_rows() -> list[tuple[RelevanceFeatureInput, bool]]:
    rows = await db.fetch(
        """
        SELECT text, title, channel, heuristic_score, score, human_label
        FROM relevance_label
        WHERE human_label IS NOT NULL
        ORDER BY created_at ASC
        """,
    )
    labelled: list[tuple[RelevanceFeatureInput, bool]] = []
    for row in rows:
        labelled.append(
            (
                RelevanceFeatureInput(
                    text=str(row[0]),
                    title=row[1],
                    channel=row[2],
                    heuristic_score=float(row[3]) if row[3] is not None else None,
                    centroid_score=float(row[4]),
                ),
                bool(row[5]),
            ),
        )
    return labelled


def _train_classifier(
    features: np.ndarray,
    labels: np.ndarray,
) -> tuple[object, str]:
    lgbm_cls = _try_import_lightgbm()
    if lgbm_cls is not None and len(labels) >= 20:
        model = lgbm_cls(
            n_estimators=100,
            learning_rate=0.05,
            random_state=42,
        )
        model.fit(features, labels)
        return model, "lightgbm"

    model = LogisticRegression(max_iter=1000, random_state=42)
    model.fit(features, labels)
    return model, "logistic_regression"


async def run_training(*, output_dir: Path) -> Path:
    await db.open_pool()
    try:
        labelled = await _load_labelled_rows()
        if len(labelled) < 4:
            msg = f"Need at least 4 labelled rows, found {len(labelled)}"
            raise RuntimeError(msg)

        x_rows = [build_feature_vector(payload) for payload, _label in labelled]
        y_rows = np.asarray([1 if label else 0 for _payload, label in labelled], dtype=np.int8)
        features = np.vstack(x_rows)

        model, model_type = _train_classifier(features, y_rows)
        version = datetime.now(tz=UTC).strftime("%Y%m%dT%H%M%SZ")
        output_dir.mkdir(parents=True, exist_ok=True)
        artifact_path = output_dir / f"relevance_{version}.joblib"
        sidecar_path = output_dir / f"relevance_{version}.json"

        bundle = {
            "model": model,
            "feature_spec": feature_spec(),
            "model_type": model_type,
            "version": version,
            "train_size": len(labelled),
            "trained_at": version,
        }
        joblib.dump(bundle, artifact_path)
        sidecar_path.write_text(
            json.dumps(
                {
                    "artifact": artifact_path.name,
                    "model_type": model_type,
                    "feature_spec": bundle["feature_spec"],
                    "train_size": len(labelled),
                    "trained_at": version,
                },
                indent=2,
            ),
            encoding="utf-8",
        )
        logger.info("Saved relevance model to %s", artifact_path)
        return artifact_path
    finally:
        await db.close_pool()


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    parser = argparse.ArgumentParser(description="Train Phase 2 relevance model")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=ARTIFACTS_DIR,
        help="Directory for joblib artifact + JSON sidecar",
    )
    args = parser.parse_args()
    asyncio.run(run_training(output_dir=args.output_dir))


if __name__ == "__main__":
    main()
