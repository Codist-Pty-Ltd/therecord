"""Shared feature construction for Phase 2 relevance training and inference."""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from typing import Any, Callable

import numpy as np

from config import get_settings
from core.embeddings import embed_text

EmbedFn = Callable[[str], list[float]]


@dataclass(frozen=True)
class RelevanceFeatureInput:
    text: str
    title: str | None = None
    channel: str | None = None
    heuristic_score: float | None = None
    centroid_score: float | None = None


def feature_spec() -> dict[str, Any]:
    settings = get_settings()
    return {
        "embedding_model": settings.embedding_model,
        "embedding_dim": settings.embedding_dim,
        "meta_features": [
            "title_token_count",
            "channel_hash",
            "heuristic_score",
            "centroid_score",
        ],
    }


def _title_token_count(payload: RelevanceFeatureInput) -> float:
    title = payload.title or payload.text.split("\n", 1)[0]
    return float(len(title.split()))


def _channel_hash(channel: str | None) -> float:
    if not channel:
        return 0.0
    digest = hashlib.sha256(channel.strip().lower().encode("utf-8")).hexdigest()
    bucket = int(digest[:8], 16) % 128
    return float(bucket) / 127.0


def build_feature_vector(
    payload: RelevanceFeatureInput,
    *,
    embed_fn: EmbedFn = embed_text,
) -> np.ndarray:
    """Return embedding + metadata features as a single float vector."""
    settings = get_settings()
    embedding = np.asarray(embed_fn(payload.text), dtype=np.float32)
    if embedding.shape[0] != settings.embedding_dim:
        msg = f"Expected embedding dim {settings.embedding_dim}, got {embedding.shape[0]}"
        raise ValueError(msg)

    meta = np.asarray(
        [
            _title_token_count(payload),
            _channel_hash(payload.channel),
            float(payload.heuristic_score or 0.0),
            float(payload.centroid_score or 0.0),
        ],
        dtype=np.float32,
    )
    return np.concatenate([embedding, meta])
