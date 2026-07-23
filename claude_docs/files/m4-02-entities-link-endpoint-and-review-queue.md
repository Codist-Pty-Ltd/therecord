# M4-02 · `POST /api/entities/link` + review queue

**Produces:** endpoint + a `entity_link_candidate` table. **Depends on:** M4-01.
**Verify:** low-confidence links land in the review queue, not the canonical
tables.

```
Two parts.

PART A — TypeORM migration in apps/api (M0-01 pattern):
Create entity_link_candidate:
  id            UUID PK DEFAULT gen_random_uuid()
  mention       TEXT NOT NULL
  entity_type   TEXT NOT NULL
  source_type   TEXT            -- where the mention came from (story etc.)
  source_id     UUID
  suggested_id  UUID            -- top candidate canonical id, nullable
  suggested_name TEXT
  confidence    DOUBLE PRECISION NOT NULL
  status        TEXT NOT NULL DEFAULT 'pending'  -- pending|approved|rejected
  created_at    TIMESTAMPTZ DEFAULT now()
Index on (status), and on (source_type, source_id).

PART B — apps/intelligence/routers/entities.py (extend the existing entities
router if one exists, else create + register under /api):
Endpoint POST /api/entities/link
Request: { mention: str, entity_type: "person"|"commission"|"organisation",
           source_type?: str, source_id?: UUID }
Response: the LinkResult from core.linking.link_mention.
- When matched=false (below threshold), persist a row into
  entity_link_candidate (status 'pending') so a human can resolve it later.
- When matched=true, return the canonical id; do NOT write a candidate row.
- Never create canonical Person/Commission rows from this endpoint.
Full type hints, tests, ruff + mypy clean.
```
