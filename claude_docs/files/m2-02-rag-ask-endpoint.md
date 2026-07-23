# M2-02 · `POST /api/rag/ask` (retrieve + generate)

**Produces:** `/api/rag/ask` in `routers/rag.py`. **Depends on:** M1-05, M2-01.
**Verify:** posting a question returns a grounded answer + citations, or an
honest refusal.

```
Add POST /api/rag/ask to apps/intelligence/routers/rag.py (same file/router as
/api/rag/query).

Request: { query: str, top_k?: int, min_similarity?: float,
           source_types?: list[str] }
Response: { query, answer, grounded, citations: [...], sources: [retrieved
            chunks used] }

Flow: retrieve (core.retrieval) → generate (core.generation.answer) → return.
- If retrieval is empty, still call generation so it returns the honest
  grounded=false response (do not 404).
- Surface generation/API failures as 502 with a safe message.
- Keep /api/rag/query (retrieve-only) intact for debugging/eval.
Full type hints. Add tests/test_rag_ask.py that mocks the Anthropic client (no
live API in CI) and asserts: grounded=true path returns citations mapped to the
retrieved source_ids; empty-retrieval path returns grounded=false with no
citations. ruff + mypy clean.
```
