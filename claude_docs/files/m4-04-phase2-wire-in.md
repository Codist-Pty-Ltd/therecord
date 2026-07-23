# M4-04 · Wire Phase 2 model into the scorer (flagged, with fallback)

**Produces:** updated `core/relevance.py`. **Depends on:** M4-03. **Verify:**
with the flag on and an artifact present, `score()` uses the model; otherwise it
falls back to Phase 1 centroid.

```
Extend apps/intelligence/core/relevance.py to use the trained Phase 2 model when
available, without breaking Phase 1.

- Add settings: relevance_strategy: Literal["centroid","model"] = "centroid",
  relevance_model_path: str | None = None.
- When strategy == "model" AND an artifact loads successfully: build the SAME
  feature vector used in training (reuse the shared feature function from
  ml/train_relevance.py — factor it into a module both import) and predict;
  set method="model_v<version>".
- On ANY failure (missing artifact, load error, feature mismatch): log a warning
  and FALL BACK to the centroid scorer. The endpoint and YouTube agent must keep
  working regardless.
- Keep the response shape identical (score, method, model). The /api/relevance/
  score endpoint and youtube.py need no changes — they already call score().
- Lazy-load the model artifact as a cached singleton; never load at import time.
Update tests to cover: model path, fallback path, and shape stability. If the
runtime web image shouldn't carry lightgbm, make the model import lazy and
optional so importing relevance.py never hard-fails when lightgbm is absent.
ruff + mypy clean.
```
