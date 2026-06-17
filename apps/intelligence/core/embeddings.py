"""CPU embeddings via fastembed (ONNX) — lazy-loaded singleton."""

from __future__ import annotations

import logging
import threading
from typing import TYPE_CHECKING

from config import get_settings

if TYPE_CHECKING:
    from fastembed import TextEmbedding

logger = logging.getLogger(__name__)

_model: TextEmbedding | None = None
_model_lock = threading.Lock()


def _get_model() -> TextEmbedding:
    """Return the cached TextEmbedding model, loading on first use."""
    global _model
    if _model is not None:
        return _model
    with _model_lock:
        if _model is not None:
            return _model
        from fastembed import TextEmbedding

        settings = get_settings()
        logger.info("Loading fastembed model '%s'", settings.embedding_model)
        _model = TextEmbedding(model_name=settings.embedding_model)
        return _model


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Encode a batch of strings into embedding vectors."""
    if not texts:
        return []

    settings = get_settings()
    model = _get_model()
    vectors: list[list[float]] = []
    for embedding in model.embed(texts):
        vec = embedding.tolist() if hasattr(embedding, "tolist") else list(embedding)
        if len(vec) != settings.embedding_dim:
            msg = (
                f"Embedding dimension mismatch: expected {settings.embedding_dim}, "
                f"got {len(vec)}"
            )
            raise ValueError(msg)
        vectors.append(vec)
    return vectors


def embed_text(text: str) -> list[float]:
    """Encode a single string."""
    results = embed_texts([text])
    return results[0]
