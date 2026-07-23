# The Record — Intelligence Layer · M0 Cursor Prompts

Paste-in-order prompts to generate the **M0 (Plumbing)** starter files for the
`services/intelligence/` Python service.

**M0 done =** container on `therecord-network`, `/health` returns 200 (and
confirms DB connectivity + pgvector), CI green, deployable behind the SSH tunnel.

**How to use:**
1. Open Cursor in the repo root.
2. Paste the **Context block** once into chat (or save it as `.cursorrules` in
   `services/intelligence/`).
3. Run prompts **1 → 9** in order. Review each diff against the scaffold before
   accepting.
4. Run the verification steps at the bottom.

Scope note: M0 deliberately excludes embeddings/RAG. No `sentence-transformers`
or model download yet — that lands in M1. Keep the image lean.

---

## Context block (paste first / use as .cursorrules)

```
You are scaffolding a new Python microservice in the Codist "The Record" repo at
services/intelligence/. It is the product's intelligence layer (RAG + entity
linking + relevance scoring), but for now we are ONLY building M0: plumbing.

Environment and conventions — follow exactly:
- Python 3.12.
- FastAPI + Uvicorn (standard).
- Postgres access via psycopg v3 (async) with psycopg_pool AsyncConnectionPool.
- pgvector for vectors; register the vector type on each pooled connection.
- Config via Pydantic v2 + pydantic-settings, env-driven (no hardcoded secrets).
- Lint/format/types: ruff, black, mypy (strict-ish on app/).
- Tests: pytest + pytest-asyncio + testcontainers (Postgres).
- Runs as a Docker container on the EXISTING external docker network
  "therecord-network", alongside Postgres 16 (service name "db", internal).
- Clean separation: app/api (routers), app/core (logic), app/models (schemas),
  app/jobs (batch). Type hints everywhere. No business logic in main.py.
- Deploy target: server 65.109.7.45, user therecord, app root /opt/therecord/app.
  Images go to GHCR under the LOWERCASE org path: ghcr.io/codist-pty-ltd/...
- Ops reality: DATABASE_URL password contains "#" which must be URL-encoded as
  "%23" in the env value; the app should consume DATABASE_URL as-is (already
  encoded) and NOT re-encode it.
- Do NOT add embedding/RAG/model dependencies yet. M0 is plumbing only.
- Do not create files beyond what each prompt asks for.
```

---

## Prompt 1 — Project skeleton + dependencies

```
Create the project skeleton for services/intelligence/.

Directory layout (create __init__.py where needed):
  app/__init__.py
  app/main.py            (empty placeholder for now)
  app/config.py          (empty placeholder)
  app/db.py              (empty placeholder)
  app/api/__init__.py
  app/core/__init__.py
  app/models/__init__.py
  app/jobs/__init__.py
  migrations/            (empty dir, add .gitkeep)
  tests/__init__.py

Create pyproject.toml configuring ruff, black (line length 100), and mypy
(python 3.12, warn_unused_ignores, disallow_untyped_defs for app/).

Create requirements.txt (runtime):
  fastapi
  uvicorn[standard]
  pydantic
  pydantic-settings
  psycopg[binary]
  psycopg_pool
  pgvector

Create requirements-dev.txt (includes -r requirements.txt plus):
  ruff
  black
  mypy
  pytest
  pytest-asyncio
  testcontainers[postgres]

Create a .gitignore covering .venv, __pycache__, *.pyc, .env, ml/artifacts/.
Create an empty .env.example listing the variables the service will read
(see the next prompt) with placeholder values and a comment that the real
DATABASE_URL password "#" must be written as "%23".
```

---

## Prompt 2 — `app/config.py` (Pydantic settings)

```
Implement app/config.py using pydantic-settings (Pydantic v2).

Define a Settings(BaseSettings) class read from environment / .env with fields:
  - app_env: Literal["dev","staging","prod"] = "dev"
  - database_url: str            # consumed as-is, already URL-encoded
  - anthropic_api_key: str | None = None   # reused later for generation; optional in M0
  - embedding_model: str = "BAAI/bge-small-en-v1.5"  # not loaded in M0, just recorded
  - embedding_dim: int = 384
  - db_pool_min: int = 1
  - db_pool_max: int = 5
  - log_level: str = "INFO"

Use model_config = SettingsConfigDict(env_file=".env", case_sensitive=False,
extra="ignore"). Provide a cached accessor:
  @lru_cache
  def get_settings() -> Settings
Add a module docstring and full type hints. Do not log secret values.
```

---

## Prompt 3 — `app/db.py` (async pool + pgvector registration)

```
Implement app/db.py: an async Postgres layer using psycopg v3 and
psycopg_pool.AsyncConnectionPool, with pgvector registered per connection.

Requirements:
- A module-level pool reference plus open_pool()/close_pool() coroutines used by
  the FastAPI lifespan.
- Build the pool from get_settings().database_url with min_size=db_pool_min,
  max_size=db_pool_max, open=False; open it explicitly in open_pool().
- Register the pgvector type on each new connection via the pool's
  `configure` hook using pgvector.psycopg.register_vector_async (handle the case
  where the vector extension may not yet exist — registration should not crash
  pool startup; log a warning instead).
- Provide an async context manager `connection()` that yields a pooled
  connection.
- Provide async def healthcheck() -> dict that runs "SELECT 1", checks whether
  the 'vector' extension is installed (query pg_extension), and returns
  {"db": "ok", "pgvector": true/false}. On failure, raise so the caller can
  return 503.
Full type hints, docstrings, no print statements (use logging).
```

---

## Prompt 4 — `app/main.py` + health router

```
Implement the FastAPI app.

app/api/health.py:
- APIRouter with GET /health.
- Calls app.db.healthcheck(). On success return 200 with
  {"status":"ok","app_env":<env>,"db":"ok","pgvector":<bool>}.
- On failure return 503 with {"status":"degraded","detail":<safe message>}.
  Do not leak connection strings or stack traces.

app/main.py:
- Create FastAPI app with an async lifespan that calls db.open_pool() on startup
  and db.close_pool() on shutdown.
- Configure logging from settings.log_level.
- Include the health router.
- Keep main.py thin: no business logic, no DB calls inline.
Add a __main__ guard running uvicorn on host 0.0.0.0 port 8002 for local use.
```

---

## Prompt 5 — `migrations/001_pgvector_embeddings.sql`

```
Create migrations/001_pgvector_embeddings.sql.

Contents:
- CREATE EXTENSION IF NOT EXISTS vector;
- CREATE TABLE IF NOT EXISTS doc_chunk (
    id BIGSERIAL PRIMARY KEY,
    source_type TEXT NOT NULL,
    source_id BIGINT NOT NULL,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(384),
    created_at TIMESTAMPTZ DEFAULT now()
  );
- ivfflat cosine index on embedding (lists = 100), created IF NOT EXISTS.
- btree index on (source_type, source_id), IF NOT EXISTS.

Add a comment at the top: embedding dim 384 matches BAAI/bge-small-en-v1.5; if
the embedding model changes, the column type and index must change too. Note
that ivfflat requires ANALYZE after the first bulk load (M1).

Also create a tiny migrations/README.md explaining how to apply:
  psql "$DATABASE_URL" -f migrations/001_pgvector_embeddings.sql
and reminding that on this host the password "#" is "%23" in DATABASE_URL.
```

---

## Prompt 6 — `Dockerfile`

```
Create services/intelligence/Dockerfile.

- Base: python:3.12-slim.
- Set workdir /app, PYTHONUNBUFFERED=1, PYTHONDONTWRITEBYTECODE=1.
- Install only runtime deps: copy requirements.txt first, pip install
  --no-cache-dir, then copy app/ and migrations/.
- Create and run as a non-root user.
- Expose 8002.
- HEALTHCHECK using python to curl/urllib GET http://localhost:8002/health
  (no extra packages — use urllib).
- CMD: uvicorn app.main:app --host 0.0.0.0 --port 8002.
Keep the image lean; do NOT install dev or embedding dependencies.
```

---

## Prompt 7 — Compose (dev + prod service entry)

```
Create two compose files in services/intelligence/.

docker-compose.dev.yml:
- service "db": postgres:16, env for a local dev database, a named volume,
  port 5432 published locally, healthcheck via pg_isready.
- service "intelligence": build ., depends_on db (service_healthy),
  env_file .env, ports "8002:8002".
- A default network for local use.

docker-compose.prod.yml (snippet meant to merge into the existing stack):
- service "intelligence": image ghcr.io/codist-pty-ltd/therecord-intelligence:latest,
  env_file .env, restart: unless-stopped, NO published ports (internal only),
  attached to the EXTERNAL network "therecord-network".
- Declare therecord-network as external: true.
Add a comment: reload env with `compose down && compose up -d` (docker restart
does NOT reload .env on this host).
```

---

## Prompt 8 — CI workflow

```
Create .github/workflows/intelligence.yml.

Trigger on push with paths filter "services/intelligence/**".

Job "test" (ubuntu-latest):
  - checkout
  - setup-python 3.12
  - pip install -r services/intelligence/requirements-dev.txt
  - ruff check services/intelligence
  - black --check services/intelligence
  - mypy services/intelligence/app
  - pytest services/intelligence -q   (testcontainers will start Postgres)

Job "build-push" (needs: test, only on push to main):
  - checkout
  - docker/login-action to ghcr.io using github.actor / GITHUB_TOKEN
  - build services/intelligence tagged
    ghcr.io/codist-pty-ltd/therecord-intelligence:${{ github.sha }} and :latest
  - push both tags
Remember the GHCR org path MUST be lowercase: codist-pty-ltd.
```

---

## Prompt 9 — Health integration test

```
Create tests/test_health.py.

Use testcontainers PostgresContainer to start Postgres 16, apply
migrations/001_pgvector_embeddings.sql against it, set DATABASE_URL to the
container's URL, then use httpx ASGITransport (or FastAPI TestClient with
lifespan) to call GET /health.

Assertions:
- status code 200
- body["status"] == "ok"
- body["db"] == "ok"
- body["pgvector"] is True   (extension was created by the migration)

Mark async tests appropriately for pytest-asyncio. Add httpx to
requirements-dev.txt if not already present. Ensure the app lifespan (pool
open/close) runs during the test.
```

---

## Verification (after running all 9)

Local:
```bash
cd services/intelligence
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt

docker compose -f docker-compose.dev.yml up -d db
psql "$DATABASE_URL" -f migrations/001_pgvector_embeddings.sql
uvicorn app.main:app --reload --port 8002

curl -s localhost:8002/health | jq
# expect: {"status":"ok","app_env":"dev","db":"ok","pgvector":true}

pytest -q
```

Prod (behind SSH tunnel, as therecord user on 65.109.7.45):
```bash
# merge the intelligence service into the live stack, then:
docker compose down && docker compose up -d        # NOT docker restart
docker compose exec -T db psql "$DATABASE_URL" -f /path/migrations/001_pgvector_embeddings.sql
# tunnel to the internal port and confirm /health returns 200
```

**M0 is complete when** `/health` returns `pgvector: true` in prod and the
`intelligence` workflow is green. Next: M1 — corpus embedding job + `/rag/query`.
