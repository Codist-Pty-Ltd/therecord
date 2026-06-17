"""Deterministic, entity-aware text chunking for RAG indexing."""

from __future__ import annotations

import hashlib
import re

_WHITESPACE_RE = re.compile(r"\s+")


def _normalise(text: str) -> str:
    return _WHITESPACE_RE.sub(" ", text.strip())


def content_hash(text: str) -> str:
    """Stable sha256 hex digest of normalised chunk text."""
    return hashlib.sha256(_normalise(text).encode("utf-8")).hexdigest()


def _word_count(text: str) -> int:
    return len(_WHITESPACE_RE.split(_normalise(text)))


def _split_sentences(paragraph: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+", paragraph.strip())
    return [p.strip() for p in parts if p.strip()]


def chunk_text(
    content: str,
    *,
    target_tokens: int = 350,
    overlap: int = 50,
) -> list[str]:
    """
    Split prose into overlapping chunks (~word-count proxy for tokens).

    Breaks on paragraph boundaries first, then sentences, avoiding mid-sentence
    splits where possible.
    """
    normalised = _normalise(content)
    if not normalised:
        return []

    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", content) if p.strip()]
    if not paragraphs:
        paragraphs = [normalised]

    units: list[str] = []
    for paragraph in paragraphs:
        sentences = _split_sentences(paragraph)
        if not sentences:
            continue
        if len(sentences) == 1 and _word_count(sentences[0]) > target_tokens:
            units.extend(_split_long_sentence(sentences[0], target_tokens))
        else:
            units.extend(sentences)

    if not units:
        return [normalised]

    chunks: list[str] = []
    current: list[str] = []
    current_words = 0

    for unit in units:
        unit_words = _word_count(unit)
        if unit_words > target_tokens:
            if current:
                chunks.append(_WHITESPACE_RE.sub(" ", " ".join(current)).strip())
                current = []
                current_words = 0
            chunks.extend(_split_long_sentence(unit, target_tokens))
            continue

        if current_words + unit_words > target_tokens and current:
            chunks.append(_WHITESPACE_RE.sub(" ", " ".join(current)).strip())
            overlap_units: list[str] = []
            overlap_words = 0
            for prev in reversed(current):
                w = _word_count(prev)
                if overlap_words + w > overlap:
                    break
                overlap_units.insert(0, prev)
                overlap_words += w
            current = overlap_units
            current_words = overlap_words

        current.append(unit)
        current_words += unit_words

    if current:
        chunks.append(_WHITESPACE_RE.sub(" ", " ".join(current)).strip())

    return [c for c in chunks if c]


def _split_long_sentence(sentence: str, target_tokens: int) -> list[str]:
    """Fallback split for a single sentence that exceeds the target size."""
    words = _WHITESPACE_RE.split(_normalise(sentence))
    if len(words) <= target_tokens:
        return [sentence.strip()]
    parts: list[str] = []
    for i in range(0, len(words), target_tokens):
        parts.append(" ".join(words[i : i + target_tokens]))
    return parts
