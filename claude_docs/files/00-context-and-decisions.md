# 00 · Context & Decisions (read first)

Paste this once into Cursor chat at the start of a session, or save it as
`apps/intelligence/.cursorrules`. Every numbered prompt assumes it.

These prompts build the **intelligence layer** for The Record, reconciled
against the *actual* repo (not the original greenfield spec).

## Repo reality (confirmed)
- Live service lives at **`apps/intelligence/`** (FastAPI on `:8001`, container
  `therecord-intelligence`). Routers live in `apps/intelligence/routers/`.
- Existing endpoints under the **`/api/...`** prefix: `/api/entities/extract`,
  `/api/legal/map`, `/api/summary/simplify`, `/api/cluster/match`,
  `/api/youtube/discover`, and `GET /health` (liveness only).
- YouTube scoring is rule-based in `apps/intelligence/routers/youtube.py`
  (base 0.3 + bonuses, then `if score < 0.4: continue`). That hardcoded `0.4`
  is what workstream C replaces.
- Nest calls the service via `IntelligenceClient`
  (`apps/api/src/intelligence/intelligence.client.ts`).
- `DATABASE_URL` is already injected into the intelligence container in
  `docker-compose.yml`, but `main.py` does not connect to Postgres yet.
- CI already runs `ruff` + `mypy` on `apps/intelligence` via the shared
  `ci.yml`. The Record's schema changes ship as **TypeORM migrations** in
  `apps/api`, applied by `node dist/database/run-migrations.js`.
- IDs across The Record (Story, Person, Commission, TimelineEvent, SIU) are
  **UUIDs**.

## Locked decisions (override here if you disagree)
1. **Extend `apps/intelligence`** — one container, one deploy. Do NOT create a
   new `services/intelligence/` directory.
2. **Embeddings = `fastembed`** (ONNX, model `BAAI/bge-small-en-v1.5`, 384-dim).
   No `sentence-transformers`, no `torch`. **Lazy-load** the model as a
   singleton so existing endpoints and `/health` are never blocked by it. Heavy
   indexing runs as a CLI job, not in the web process.
3. **Schema via TypeORM migration in `apps/api`** (not raw SQL in Python).
   Python only reads/writes the tables.
4. **`source_id` is `UUID`**; the chunk table is polymorphic via
   `(source_type, source_id)` — no FK.
5. **New endpoints keep the `/api/` prefix**: `/api/rag/query`, `/api/rag/ask`,
   `/api/relevance/score`, `/api/entities/link`.
6. **No new GHCR workflow** — the existing pipeline already builds/deploys the
   container; just don't break `ruff`/`mypy`.

## Conventions for every prompt
- Python 3.12, full type hints, `logging` (never `print`), no secrets in logs.
- **Match existing patterns**: register new routers exactly how current routers
  are registered in `main.py`; reuse any existing settings/config module if one
  exists, otherwise create `apps/intelligence/config.py`.
- Postgres access: psycopg v3 async + `psycopg_pool.AsyncConnectionPool`, with
  pgvector registered per connection.
- Ops gotchas to respect: in `DATABASE_URL` the password `#` is written `%23`
  (consume the URL as-is, never re-encode); reload env with
  `compose down && compose up -d`, never `docker restart`; GHCR org path is
  lowercase `codist-pty-ltd`.
- Tests: `pytest` + `pytest-asyncio` + `testcontainers[postgres]`. Don't add
  network-dependent tests to CI for the embedding model download — gate those
  behind a marker.

## Build order
M0 plumbing → M1 embed+retrieve → M2 grounded answers → M3 relevance Phase 1
(kill the `0.4`) → M4 entity linking + Phase 2 ML.

## File index
```
00-context-and-decisions.md          ← you are here
m0-01-pgvector-migration.md
m0-02-config.md
m0-03-db-pool.md
m0-04-health-endpoint.md
m0-05-deps-and-health-test.md
m1-01-embeddings-fastembed.md
m1-02-chunking.md
m1-03-index-corpus-job.md
m1-04-retrieval.md
m1-05-rag-query-endpoint.md
m2-01-generation.md
m2-02-rag-ask-endpoint.md
m2-03-nest-proxy.md
m3-01-relevance-centroid.md
m3-02-relevance-endpoint.md
m3-03-youtube-swap-and-labels.md
m4-01-entity-linking.md
m4-02-entities-link-endpoint-and-review-queue.md
m4-03-phase2-train-eval.md
m4-04-phase2-wire-in.md
```
