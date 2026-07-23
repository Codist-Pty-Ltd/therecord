# M2-01 · Grounded generation (Claude over retrieved chunks)

**Produces:** `apps/intelligence/core/generation.py`. **Depends on:** M1-04.
**Verify:** answers cite real `source_id`s and refuse when retrieval is weak.

```
Create apps/intelligence/core/generation.py: grounded answer generation using
the Anthropic API. Reuse the same Anthropic client/key the existing
/api/summary/simplify endpoint uses (settings.anthropic_api_key,
settings.anthropic_model) — one source of truth.

async def answer(query: str, chunks: list[RetrievedChunk]) -> AnswerResult
where AnswerResult is Pydantic:
  { answer: str, grounded: bool,
    citations: [ { source_type, source_id, chunk_index } ] }

Rules:
- Build a prompt that gives Claude ONLY the retrieved chunks as context, each
  tagged with an index and its (source_type, source_id). Instruct the model to
  answer strictly from the supplied context and to reference chunk indices it
  used.
- If chunks is empty OR the model indicates the context is insufficient, return
  grounded=false with a short honest "not enough sourced material" answer and
  empty citations. NEVER fabricate facts or citations.
- Map the chunk indices the model cited back to real (source_type, source_id)
  for the citations list.
- Add the anthropic SDK to requirements. Full type hints, logging (no prompt
  secrets), docstrings. Handle API errors gracefully (raise a typed error the
  router can turn into 502).
```
