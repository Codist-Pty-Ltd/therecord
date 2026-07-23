# M3-01 · Relevance scorer — Phase 1 (centroid similarity)

**Produces:** `apps/intelligence/core/relevance.py`. **Depends on:** M1-01,
M1-03. **Verify:** scoring a clearly-relevant transcript yields a high score; an
off-topic one yields low.

```
Create apps/intelligence/core/relevance.py: a Phase 1 relevance scorer that
replaces the hardcoded 0.4 used in routers/youtube.py.

Approach (no labels yet):
- Build a "relevance centroid": the mean embedding of the existing
  known-relevant corpus. Source it from doc_chunk (the already-indexed Record
  stories/commissions represent on-topic SA accountability material). Compute
  the centroid lazily and cache it; expose a function to refresh it.
- async def score(text: str) -> RelevanceScore where RelevanceScore is Pydantic:
  { score: float (0..1), method: "centroid_v1", model: <embedding_model> }.
  score = normalised cosine similarity between embed(text) and the centroid.
- Provide a configurable threshold (settings, default e.g. 0.45 — calibrate
  later) and a helper is_relevant(text) -> bool, but DO NOT bake the threshold
  into score().
- Handle the cold-start case (empty doc_chunk → no centroid): return a clearly
  flagged neutral score and log a warning, so callers can fall back to the old
  heuristic.
Full type hints, logging, docstrings. Add a unit test with a tiny synthetic
centroid asserting relative ordering of on-topic vs off-topic text.
```
