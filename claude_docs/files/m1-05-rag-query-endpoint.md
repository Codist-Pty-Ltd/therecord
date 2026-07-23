# M1-05 · `POST /api/rag/query` (retrieve only)

**Produces:** `apps/intelligence/routers/rag.py` + registration. **Depends on:**
M1-04. **Verify:** posting a question returns ranked chunks with source refs.

```
Create apps/intelligence/routers/rag.py and register it in main.py exactly the
way existing routers are registered, under the /api prefix.

Endpoint: POST /api/rag/query
Request (Pydantic): { query: str, top_k?: int, min_similarity?: float,
                      source_types?: list[str] }
Response (Pydantic): { query: str,
  results: [ { chunk_id, source_type, source_id, chunk_index, content,
               similarity } ] }
- Delegate to core.retrieval.retrieve. No generation yet.
- Validate query non-empty; clamp top_k to a sane max (e.g. 20).
- Return 200 with an empty results list (not an error) when nothing clears the
  similarity floor.
Full type hints. Add tests/test_rag_query.py (testcontainers + a couple indexed
chunks) asserting the endpoint returns the expected source_id first. Keep ruff
and mypy clean.
```
