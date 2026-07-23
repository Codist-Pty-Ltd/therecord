# M3-02 · `POST /api/relevance/score`

**Produces:** `apps/intelligence/routers/relevance.py` + registration.
**Depends on:** M3-01. **Verify:** posting text returns a score + method tag.

```
Create apps/intelligence/routers/relevance.py and register it in main.py like
the other routers, under /api.

Endpoint: POST /api/relevance/score
Request: { text: str }   (e.g. a video title + description + transcript snippet)
Response: { score: float, method: str, model: str, relevant: bool,
            threshold: float }
- Delegate to core.relevance.score and is_relevant.
- Validate text non-empty. Return the threshold used so callers can see why.
Full type hints. Add a test (mock/synthetic centroid) asserting the response
shape and that relevant flips around the threshold. ruff + mypy clean.
```
