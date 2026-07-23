# M0-05 · Dependencies + `/health` integration test

**Produces:** updated requirements, a health test. **Depends on:** M0-03/04.
**Verify:** `ruff` + `mypy` clean; `pytest -q` green; CI still passes.

```
Update dependencies for apps/intelligence and add a health integration test.

Dependencies — add to the intelligence service's runtime requirements (match
the file the service already uses — requirements.txt or pyproject):
  psycopg[binary]
  psycopg_pool
  pgvector
Add to dev/test deps:
  pytest
  pytest-asyncio
  testcontainers[postgres]
  httpx
Do NOT add fastembed/anthropic yet — those land in M1/M2. Keep the image lean.

Test — tests/test_health.py:
- Start Postgres 16 via testcontainers PostgresContainer.
- Apply the doc_chunk migration SQL to it (run the same raw SQL the TypeORM
  migration runs, or shell out to the migration runner — simplest is executing
  the raw CREATE EXTENSION/CREATE TABLE statements).
- Point DATABASE_URL at the container, run the app with its lifespan, call
  GET /health via httpx ASGITransport.
- Assert: 200; body["status"]=="ok"; body["db"]=="ok"; body["pgvector"] is True.
Mark async tests for pytest-asyncio. Ensure ruff and mypy still pass on
apps/intelligence so the shared ci.yml stays green.
```
