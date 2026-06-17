"""Unit tests for core.chunking."""

from __future__ import annotations

from core.chunking import chunk_text, content_hash


def test_content_hash_is_stable_for_same_input() -> None:
    text = "First paragraph.\n\nSecond paragraph with more words."
    assert content_hash(text) == content_hash(text)
    assert content_hash("  hello   world  ") == content_hash("hello world")


def test_empty_and_whitespace_return_no_chunks() -> None:
    assert chunk_text("") == []
    assert chunk_text("   \n\n  \t  ") == []


def test_long_text_produces_multiple_overlapping_chunks() -> None:
    paragraphs = [
        f"Paragraph {i} discusses commissions, accountability, and public inquiry {i}."
        for i in range(40)
    ]
    content = "\n\n".join(paragraphs)
    chunks = chunk_text(content, target_tokens=50, overlap=10)

    assert len(chunks) > 1
    assert all(chunk.strip() for chunk in chunks)
    assert len({content_hash(chunk) for chunk in chunks}) > 1


def test_paragraph_boundaries_are_respected() -> None:
    content = "Alpha paragraph ends here.\n\nBeta paragraph starts here."
    chunks = chunk_text(content, target_tokens=350, overlap=0)
    assert len(chunks) == 1
    assert "Alpha" in chunks[0]
    assert "Beta" in chunks[0]
