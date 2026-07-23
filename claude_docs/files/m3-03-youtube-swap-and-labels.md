# M3-03 · Swap YouTube `0.4` → scorer + log labels

**Produces:** edited `routers/youtube.py` + a labels migration/table. **Depends
on:** M3-01/02. **Verify:** the agent ranks by real scores; scored items are
persisted for Phase 2; still never auto-publishes.

```
Two parts.

PART A — schema (TypeORM migration in apps/api, same pattern as M0-01):
Create table relevance_label for Phase 2 training data:
  id            UUID PK DEFAULT gen_random_uuid()
  video_id      TEXT NOT NULL
  title         TEXT
  channel       TEXT
  text          TEXT NOT NULL          -- the scored text
  score         DOUBLE PRECISION NOT NULL
  method        TEXT NOT NULL          -- 'centroid_v1' etc
  heuristic_score DOUBLE PRECISION      -- old rule-based score, for comparison
  human_label   BOOLEAN                -- NULL until a reviewer labels it
  created_at    TIMESTAMPTZ DEFAULT now()
  UNIQUE(video_id)
Index on (human_label) for pulling the unlabelled review queue.

PART B — edit apps/intelligence/routers/youtube.py:
- Replace the hardcoded "if score < 0.4: continue" with a call to
  core.relevance.score(text) (text = title + channel + description/snippet the
  router already has). Use core.relevance.is_relevant for the cutoff.
- KEEP the existing rule-based heuristic score: compute both, store the
  heuristic in heuristic_score, use the centroid score for ranking/filtering.
- If the centroid is cold (no doc_chunk yet), fall back to the old 0.4 heuristic
  and log it.
- Persist every discovered+scored item into relevance_label (upsert on
  video_id), human_label NULL. This is the Phase 2 dataset.
- CRITICAL: preserve current behaviour that the agent NEVER auto-publishes — it
  only discovers, scores, and queues for human review. Do not add publishing.
Update any tests for youtube.py. ruff + mypy clean.
```
