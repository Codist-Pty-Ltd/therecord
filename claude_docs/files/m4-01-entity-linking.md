# M4-01 · Entity linking (mention → canonical, confidence-gated)

**Produces:** `apps/intelligence/core/linking.py`. **Depends on:** M1-01;
existing `/api/entities/extract`. **Verify:** "President Ramaphosa" resolves to
the canonical Person; an unknown name returns a low-confidence candidate.

```
Create apps/intelligence/core/linking.py: resolve extracted entity mentions to
canonical Record rows.

async def link_mention(mention: str, entity_type: Literal["person","commission",
"organisation"]) -> LinkResult
where LinkResult is Pydantic:
  { mention: str, matched: bool, canonical_id: UUID | None,
    canonical_name: str | None, confidence: float, candidates: [
      { id: UUID, name: str, score: float } ] }

Approach (hybrid):
- Pull candidate canonical rows from Postgres for the given type (Person /
  Commission / org). Read ACTUAL table+name columns from the repo schema.
- Score candidates by a blend of: normalised string similarity (e.g.
  rapidfuzz token_set_ratio) AND embedding cosine similarity (core.embeddings)
  of mention vs canonical name/aliases. Combine into a single confidence (0..1).
- matched=true only above a configurable high-confidence threshold (settings,
  default e.g. 0.82). Otherwise matched=false and return the top candidates for
  human review — NEVER auto-create a new canonical row here.
- Cache canonical name embeddings to avoid recomputing per request.
Add rapidfuzz to requirements. Full type hints, logging, docstrings, unit test
on a small in-memory candidate set asserting ordering + threshold behaviour.
```
