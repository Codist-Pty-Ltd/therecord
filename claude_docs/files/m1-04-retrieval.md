# M1-04 · Retrieval (top-k cosine over pgvector)

**Produces:** `apps/intelligence/core/retrieval.py`. **Depends on:** M0, M1-01,
M1-03. **Verify:** a query about an indexed topic returns the right
`source_id`s ordered by similarity.

```
Create apps/intelligence/core/retrieval.py: vector retrieval over doc_chunk.

Requirements:
- async def retrieve(query: str, *, top_k: int | None = None,
  min_similarity: float | None = None,
  source_types: list[str] | None = None) -> list[RetrievedChunk]
  where RetrievedChunk is a Pydantic model:
  { chunk_id: UUID, source_type: str, source_id: UUID, chunk_index: int,
    content: str, similarity: float }.
- Embed the query via core.embeddings, then query Postgres with pgvector cosine
  distance:  ORDER BY embedding <=> %s LIMIT k. Convert distance to similarity
  (1 - distance). Apply min_similarity filter (default settings.rag_min_similarity)
  and optional source_types filter. top_k defaults to settings.rag_top_k.
- Pass the query vector as a pgvector param (the registered adapter handles it).
- Use the async db pool. Full type hints, logging, docstrings.
Add tests/test_retrieval.py using testcontainers: insert a few known chunks with
hand-made embeddings (or embed short strings), assert retrieve() ranks the
expected chunk first and respects min_similarity.
```
