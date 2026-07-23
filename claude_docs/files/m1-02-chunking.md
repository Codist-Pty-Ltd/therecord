# M1-02 · Entity-aware chunking

**Produces:** `apps/intelligence/core/chunking.py`. **Depends on:** nothing
(pure functions). **Verify:** unit tests over sample text produce stable chunks
+ hashes.

```
Create apps/intelligence/core/chunking.py: deterministic, entity-aware chunking.

Requirements:
- def chunk_text(content: str, *, target_tokens: int = 350, overlap: int = 50)
  -> list[str]: split prose into chunks of roughly target_tokens with a small
  overlap, breaking on paragraph/sentence boundaries where possible (a simple
  whitespace/word-count approximation of tokens is fine — no tokenizer
  dependency). Never split mid-sentence if avoidable.
- def content_hash(text: str) -> str: stable sha256 hex of the normalised chunk
  (strip + collapse whitespace) — used for idempotent re-indexing.
- Pure, deterministic, no I/O, no model calls. Full type hints + docstrings.
Add tests/test_chunking.py: same input → identical chunks and hashes;
empty/whitespace input → empty list; long input → multiple overlapping chunks.
```
