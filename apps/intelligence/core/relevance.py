"""Phase 1 relevance scoring with optional Phase 2 model inference."""

from __future__ import annotations

import asyncio
import logging
import math
import threading
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field

import db
from config import get_settings
from core.embeddings import embed_text

logger = logging.getLogger(__name__)

COLD_START_SCORE = 0.5
HEURISTIC_FALLBACK_THRESHOLD = 0.4

_centroid: list[float] | None = None
_centroid_lock = asyncio.Lock()
_model_bundle: dict[str, Any] | None = None
_model_lock = threading.Lock()


class RelevanceScore(BaseModel):
    """Embedding-based relevance against the indexed corpus centroid."""

    score: float = Field(ge=0.0, le=1.0)
    method: str
    model: str
    cold_start: bool = False


def _as_vector(raw: Any) -> list[float]:
    if isinstance(raw, list):
        return [float(x) for x in raw]
    if isinstance(raw, str):
        inner = raw.strip("[]")
        if not inner:
            return []
        return [float(part) for part in inner.split(",")]
    if hasattr(raw, "tolist"):
        return [float(x) for x in raw.tolist()]
    raise TypeError(f"Unsupported embedding value type: {type(raw)!r}")


def _normalize(vector: list[float]) -> list[float]:
    norm = math.sqrt(sum(value * value for value in vector))
    if norm == 0:
        return vector
    return [value / norm for value in vector]


def _cosine_similarity(left: list[float], right: list[float]) -> float:
    if len(left) != len(right):
        msg = f"Vector dimension mismatch: {len(left)} vs {len(right)}"
        raise ValueError(msg)
    dot = sum(a * b for a, b in zip(left, right, strict=True))
    return max(0.0, min(1.0, dot))


async def _fetch_centroid_from_db() -> list[float] | None:
    rows = await db.fetch(
        """
        SELECT AVG(embedding)::vector
        FROM doc_chunk
        WHERE embedding IS NOT NULL
        """,
    )
    if not rows or rows[0][0] is None:
        return None
    return _normalize(_as_vector(rows[0][0]))


async def refresh_centroid() -> bool:
    """Recompute and cache the corpus centroid. Returns True when populated."""
    global _centroid
    async with _centroid_lock:
        centroid = await _fetch_centroid_from_db()
        _centroid = centroid
        if centroid is None:
            logger.warning("Relevance centroid refresh: doc_chunk is empty (cold start)")
            return False
        logger.info("Relevance centroid refreshed (dim=%s)", len(centroid))
        return True


async def get_centroid() -> list[float] | None:
    """Return the cached centroid, loading it lazily on first use."""
    global _centroid
    if _centroid is not None:
        return _centroid
    async with _centroid_lock:
        if _centroid is None:
            _centroid = await _fetch_centroid_from_db()
            if _centroid is None:
                logger.warning(
                    "Relevance centroid unavailable — doc_chunk has no embeddings yet",
                )
        return _centroid


def _load_model_bundle() -> dict[str, Any] | None:
    global _model_bundle
    with _model_lock:
        if _model_bundle is not None:
            return _model_bundle

        settings = get_settings()
        path_value = settings.relevance_model_path
        if not path_value:
            return None

        path = Path(path_value)
        if not path.exists():
            logger.warning("Relevance model artifact not found at %s", path)
            return None

        try:
            import joblib

            _model_bundle = joblib.load(path)
        except Exception as exc:  # noqa: BLE001 — optional dependency path
            logger.warning("Failed to load relevance model from %s: %s", path, exc)
            return None

        return _model_bundle


def _predict_model_score(
    text: str,
    *,
    centroid_score: float | None,
) -> RelevanceScore | None:
    bundle = _load_model_bundle()
    if bundle is None:
        return None

    try:
        import numpy as np
        from ml.relevance_features import RelevanceFeatureInput, build_feature_vector

        features = build_feature_vector(
            RelevanceFeatureInput(text=text, centroid_score=centroid_score),
        )
        model = bundle["model"]
        matrix = np.asarray([features], dtype=np.float32)
        if hasattr(model, "predict_proba"):
            probability = float(model.predict_proba(matrix)[0][1])
        else:
            raw = float(model.decision_function(matrix)[0])
            probability = 1.0 / (1.0 + math.exp(-raw))

        version = str(bundle.get("version", "unknown"))
        model_type = str(bundle.get("model_type", "model"))
        settings = get_settings()
        return RelevanceScore(
            score=max(0.0, min(1.0, probability)),
            method=f"model_v{version}",
            model=f"{model_type}:{settings.embedding_model}",
            cold_start=False,
        )
    except Exception as exc:  # noqa: BLE001 — fall back to centroid
        logger.warning("Phase 2 relevance inference failed: %s", exc)
        return None


async def _score_centroid(text: str) -> RelevanceScore:
    settings = get_settings()
    normalised = text.strip()
    if not normalised:
        return RelevanceScore(
            score=0.0,
            method="centroid_v1",
            model=settings.embedding_model,
            cold_start=False,
        )

    centroid = await get_centroid()
    if centroid is None:
        return RelevanceScore(
            score=COLD_START_SCORE,
            method="centroid_v1_cold_start",
            model=settings.embedding_model,
            cold_start=True,
        )

    query_vector = _normalize(embed_text(normalised))
    similarity = _cosine_similarity(query_vector, centroid)
    return RelevanceScore(
        score=similarity,
        method="centroid_v1",
        model=settings.embedding_model,
        cold_start=False,
    )


async def score(text: str) -> RelevanceScore:
    """
    Score text using the configured relevance strategy.

    Falls back to the Phase 1 centroid scorer when the model is unavailable.
    """
    settings = get_settings()
    centroid_result = await _score_centroid(text)

    if settings.relevance_strategy == "model" and not centroid_result.cold_start:
        centroid_value = None if centroid_result.cold_start else centroid_result.score
        model_result = _predict_model_score(text, centroid_score=centroid_value)
        if model_result is not None:
            return model_result
        logger.warning("Relevance strategy=model requested; falling back to centroid_v1")

    return centroid_result


def is_relevant(result: RelevanceScore) -> bool:
    """Return whether a score clears the configured relevance threshold."""
    if result.cold_start:
        return False
    settings = get_settings()
    return result.score >= settings.relevance_threshold


async def upsert_relevance_label(
    *,
    video_id: str,
    title: str | None,
    channel: str | None,
    text: str,
    score_value: float,
    method: str,
    heuristic_score: float | None,
) -> None:
    """Persist a scored discovery row for Phase 2 human labelling."""
    await db.execute(
        """
        INSERT INTO relevance_label (
            video_id, title, channel, text, score, method, heuristic_score
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (video_id)
        DO UPDATE SET
            title = EXCLUDED.title,
            channel = EXCLUDED.channel,
            text = EXCLUDED.text,
            score = EXCLUDED.score,
            method = EXCLUDED.method,
            heuristic_score = EXCLUDED.heuristic_score
        """,
        (video_id, title, channel, text, score_value, method, heuristic_score),
    )
