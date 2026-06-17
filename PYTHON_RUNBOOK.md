# The Record — Python & Intelligence Runbook

Operator guide for **`apps/intelligence/`** (FastAPI), how it fits the full stack, local development, testing, and production deploy. For general ops see [RUNBOOK.md](./RUNBOOK.md). For ports and domains see [docs/PLATFORM_CONTEXT.md](./docs/PLATFORM_CONTEXT.md).

---

## Service overview

| Service | Container | Host port (dev) | Purpose |
|---------|-----------|-----------------|---------|
| Next.js (web) | `therecord-web` | **3090** | Frontend |
| NestJS (api) | `therecord-api` | **3091** | Backend API + ingestion; proxies intelligence |
| FastAPI (intel) | `therecord-intelligence` | **8001** | NLP, RAG, relevance, entity linking |
| PostgreSQL | `therecord-postgres` | **5432** | Database (**pgvector** required) |

**Production:** only web is published on the host (`127.0.0.1:3090`). API and intelligence are internal on `therecord-network`. Nginx proxies the public domain to web; browsers call the API via `NEXT_PUBLIC_API_URL` (often same origin `/api`).

**Architecture rule:** one intelligence container at `apps/intelligence/` — no separate `services/intelligence/`. Schema (`doc_chunk`, `relevance_label`, `entity_link_candidate`) lives in **TypeORM migrations** under `apps/api`, not Python SQL migrations.

---

## Fastest smoke test (no UI)

1. Start the stack (see [Run the full application locally](#run-the-full-application-locally)).
2. Open **http://localhost:8001/docs** (Swagger — **dev only**; disabled when `APP_ENV=prod`).
3. Try **`POST /api/rag/ask`** with a JSON body:

```json
{
  "query": "What is the Special Investigating Unit?",
  "top_k": 6
}
```

You get JSON with `answer`, `grounded`, `citations`, and `sources` immediately.

**Via Nest (same path prod uses):**

```bash
curl -s -X POST http://localhost:3091/api/intelligence/ask \
  -H "Content-Type: application/json" \
  -d '{"query":"What is the SIU?"}' | jq
```

**Via the web UI:** http://localhost:3090/ask — “Ask The Record” page.

---

## Python layout (`apps/intelligence/`)

```
apps/intelligence/
├── main.py                 # FastAPI app, /health, router mount
├── config.py               # Settings (DATABASE_URL, ANTHROPIC_*, RELEVANCE_*)
├── db.py                   # async psycopg pool + pgvector health
├── core/
│   ├── embeddings.py       # fastembed BAAI/bge-small-en-v1.5 (384-dim)
│   ├── chunking.py         # corpus text → chunks + content_hash
│   ├── retrieval.py        # vector search over doc_chunk
│   ├── generation.py       # grounded Claude answers
│   ├── relevance.py        # centroid + optional Phase 2 ML model
│   └── linking.py          # rapidfuzz + embedding entity linking
├── routers/
│   ├── rag.py              # POST /api/rag/query, /api/rag/ask
│   ├── relevance.py        # POST /api/relevance/score
│   ├── entities.py         # POST /api/entities/link (+ extract)
│   ├── youtube.py          # POST /api/youtube/discover
│   └── …                   # legal, summary, cluster
├── jobs/
│   ├── index_corpus.py     # embed stories, commissions, SIU, people, timeline
│   └── bootstrap_relevance_labels.py
├── ml/
│   ├── relevance_features.py
│   ├── train_relevance.py
│   └── eval_relevance.py
├── tests/                  # pytest suite (see Testing)
├── requirements.txt        # runtime deps (Docker image)
├── requirements-dev.txt    # pytest, testcontainers
└── requirements-ml.txt     # LightGBM etc. (train/eval only)
```

---

## Environment variables

Copy root [`.env.example`](./.env.example). Intelligence-relevant keys:

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Same Postgres as Nest; password URL-encoded |
| `ANTHROPIC_API_KEY` | For `/api/rag/ask`, summary | Without it, ask returns 503 |
| `APP_ENV` | No | `dev` \| `staging` \| `prod` — **`prod` disables `/docs`** |
| `RELEVANCE_STRATEGY` | No | `centroid` (default) or `model` |
| `RELEVANCE_MODEL_PATH` | If strategy=model | Path inside container, e.g. `/app/ml/artifacts/relevance_*.joblib` |
| `YOUTUBE_API_KEY` | For YouTube discover | Optional |

Nest proxy:

| Variable | Default (compose) |
|----------|-------------------|
| `INTELLIGENCE_URL` | `http://intelligence:8001` |
| `INTELLIGENCE_TIMEOUT_MS` | `30000` |

Web (browser ask page):

| Variable | Local | Prod |
|----------|-------|------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3091` | Public API origin |

---

## Run the full application locally

### Prerequisites

- Docker + Docker Compose v2
- Root `.env` from `.env.example`
- `ANTHROPIC_API_KEY` set for grounded Q&A

### Start everything

```bash
docker compose up --build
```

| URL | What |
|-----|------|
| http://localhost:3090 | Web (Next.js) |
| http://localhost:3091/api/health | Nest API |
| http://localhost:8001/health | Intelligence liveness |
| http://localhost:8001/docs | FastAPI Swagger (local dev) |
| http://localhost:3090/ask | Ask The Record UI |

### First-time / fresh database bootstrap

Run in order:

```bash
# 1. Migrations (pgvector + doc_chunk + relevance_label + entity_link_candidate)
docker exec therecord-api npm run migration:run

# 2. Seed corpus (required before indexing)
docker exec therecord-api npm run seed:all

# 3. Embed corpus into doc_chunk
docker exec therecord-intelligence python -m jobs.index_corpus

# 4. (Optional) Phase 2 relevance model
docker exec therecord-intelligence python -m jobs.bootstrap_relevance_labels
docker exec therecord-intelligence pip install -r requirements-ml.txt
docker exec therecord-intelligence python -m ml.train_relevance
# Then set RELEVANCE_STRATEGY=model and RELEVANCE_MODEL_PATH in .env and restart intelligence
docker compose up -d intelligence
```

Verify chunks:

```bash
docker exec therecord-postgres psql -U therecord -d therecord_db \
  -c "SELECT source_type, COUNT(*) FROM doc_chunk GROUP BY 1 ORDER BY 2 DESC;"
```

### Run intelligence outside Docker (optional)

```bash
cd apps/intelligence
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pip install https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.7.1/en_core_web_sm-3.7.1-py3-none-any.whl
export DATABASE_URL=postgresql://therecord:therecord@localhost:5432/therecord_db
export ANTHROPIC_API_KEY=...
uvicorn main:app --reload --port 8001
```

Point Nest at `INTELLIGENCE_URL=http://127.0.0.1:8001` if API runs in Docker but intel runs on host.

---

## Testing

### Intelligence (Python) — automated

**CI job:** `intelligence-lint` in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) runs:

```bash
cd apps/intelligence
ruff check .
mypy . --ignore-missing-imports
pytest -q
```

**Local:**

```bash
cd apps/intelligence
pip install -r requirements-dev.txt
pytest -q
pytest -v tests/test_rag_ask.py    # single file
```

| Test file | Covers |
|-----------|--------|
| `test_health.py` | Postgres + pgvector health |
| `test_chunking.py` | Chunking + content hashes |
| `test_retrieval.py` | Vector retrieval (mocked embed) |
| `test_rag_query.py` | `POST /api/rag/query` |
| `test_rag_ask.py` | `POST /api/rag/ask` (mocked Anthropic) |
| `test_relevance.py` | Centroid scorer |
| `test_relevance_score.py` | `POST /api/relevance/score` |
| `test_relevance_model.py` | Phase 2 model + fallback |
| `test_youtube_discover.py` | YouTube + relevance |
| `test_linking.py` | Entity linking ranking |
| `test_entities_link.py` | `POST /api/entities/link` |
| `test_train_relevance.py` | ML training smoke |

Anthropic and heavy models are **mocked** in unit tests — no API key needed for pytest.

**CI Postgres:** API jobs use `pgvector/pgvector:pg16` so TypeORM migrations that run `CREATE EXTENSION vector` succeed.

### Manual integration tests (local Docker)

```bash
# Health
curl -s http://localhost:8001/health | jq

# Retrieval only (no Claude)
curl -s -X POST http://localhost:8001/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{"query":"State Capture Commission","top_k":3}' | jq

# Full grounded ask (needs ANTHROPIC_API_KEY)
curl -s -X POST http://localhost:8001/api/rag/ask \
  -H "Content-Type: application/json" \
  -d '{"query":"Who chaired the Zondo Commission?"}' | jq

# Nest proxy + citation slug enrichment
curl -s -X POST http://localhost:3091/api/intelligence/ask \
  -H "Content-Type: application/json" \
  -d '{"query":"What does the SIU do?"}' | jq '.citations[0]'

# Relevance
curl -s -X POST http://localhost:8001/api/relevance/score \
  -H "Content-Type: application/json" \
  -d '{"text":"Zondo Commission state capture hearings","source_type":"youtube"}' | jq
```

### Web “Ask The Record”

- Page: `apps/web/app/ask/page.tsx`
- Client: `apps/web/lib/ask-client.ts` → `POST {NEXT_PUBLIC_API_URL}/api/intelligence/ask`
- No dedicated E2E test yet — verify manually at http://localhost:3090/ask

### What is **not** covered in CI

- End-to-end Nest → FastAPI → Claude with real `ANTHROPIC_API_KEY`
- Production `index_corpus` on VPS (run manually / via deploy workflow)
- Browser E2E for `/ask`

---

## Intelligence API endpoints (reference)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Liveness; checks DB + pgvector |
| POST | `/api/rag/query` | Vector retrieval only |
| POST | `/api/rag/ask` | Retrieve + grounded Claude answer |
| POST | `/api/relevance/score` | Corpus relevance (centroid or model) |
| POST | `/api/entities/link` | Mention → canonical entity |
| POST | `/api/youtube/discover` | YouTube search + relevance |
| POST | `/api/entities/extract` | spaCy NER |
| POST | `/api/legal/map` | Crime → statute mapping |
| POST | `/api/summary/simplify` | Plain-English rewrite |
| POST | `/api/cluster/match` | Article → story clustering |

Nest exposes **`POST /api/intelligence/ask`** only (proxy + citation slug enrichment). Other intelligence features are called from Nest services internally.

---

## Jobs & maintenance

### Re-index corpus

Idempotent — skips unchanged chunks by `content_hash`.

```bash
docker exec therecord-intelligence python -m jobs.index_corpus

# Single source type
docker exec therecord-intelligence python -m jobs.index_corpus --source-type story
```

Run after editorial seed changes or new migrations that add indexable text.

### Phase 2 relevance model

```bash
docker exec therecord-intelligence python -m jobs.bootstrap_relevance_labels
docker exec therecord-intelligence pip install -r requirements-ml.txt
docker exec therecord-intelligence python -m ml.train_relevance
docker exec therecord-intelligence python -m ml.eval_relevance
```

Artifacts go to `apps/intelligence/ml/artifacts/` (**gitignored**). Copy to prod or train on-server; set `RELEVANCE_STRATEGY=model` and `RELEVANCE_MODEL_PATH` in prod `.env`.

### Lint Python locally

```bash
cd apps/intelligence
ruff check .
mypy . --ignore-missing-imports
```

---

## Production deploy (with intelligence)

**Trigger:** push to `main` → [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml).

**Server steps (automated over SSH):**

1. `git pull` in `/opt/therecord/app`
2. `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`
3. `docker exec therecord-api node dist/database/run-migrations.js`
4. **`docker exec therecord-intelligence python -m jobs.index_corpus`**
5. Idempotent seeds (impact-sectors, sa-history, state-entities)
6. Health check `http://127.0.0.1:3090/api/health`

### Deploy readiness checklist

| Item | Status / action |
|------|-----------------|
| Postgres has **pgvector** | Dev compose uses `pgvector/pgvector:pg16`; prod volume must support `CREATE EXTENSION vector` |
| `ANTHROPIC_API_KEY` on VPS | Required for Ask |
| Corpus seeded | Full `seed:all` when editorial seeds change (deploy only runs partial seeds) |
| `index_corpus` after migrate | Automated in deploy.yml |
| Phase 2 model | Optional; default `RELEVANCE_STRATEGY=centroid` works without artifact |
| Swagger in prod | Disabled when `APP_ENV=prod` on intelligence container |
| Ask UI | `/ask` on web; needs `NEXT_PUBLIC_API_URL` pointing at public API |

### What production looks like

```
Internet → nginx (therecord.codist.co.za)
              → 127.0.0.1:3090 (therecord-web)
                    → API_URL http://api:3091 (server RSC)
Browser  → NEXT_PUBLIC_API_URL → /api/intelligence/ask (Nest)
              → INTELLIGENCE_URL http://intelligence:8001 (internal)
                    → FastAPI RAG + Claude
              → PostgreSQL (doc_chunk vectors)
```

Intelligence **:8001 is not exposed** on the public host in prod.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `localhost:3000` refused | Wrong port | Use **3090** (compose host mapping) |
| Ask returns 503 | No `ANTHROPIC_API_KEY` or intel down | Check `docker logs therecord-intelligence` |
| Empty / ungrounded answers | Corpus not indexed | Run `index_corpus` after seeds |
| `CREATE EXTENSION vector` fails | Plain Postgres image | Use `pgvector/pgvector:pg16` |
| Slow first ask | Embedding model cold start | Normal; optional `scripts/prewarm_embeddings.py` |
| CORS errors on `/ask` | `NEXT_PUBLIC_API_URL` mismatch | Match browser origin to API CORS config |
| zustand / stale web deps | Old anonymous node_modules volume | Rebuild web, `docker rm -v therecord-web`, `up -d web` |

---

## Related docs

- [RUNBOOK.md](./RUNBOOK.md) — general operator runbook
- [docs/PLATFORM_CONTEXT.md](./docs/PLATFORM_CONTEXT.md) — ports, CI, domains
- Root `.env.example` — all variable names

---

_Last updated: intelligence M0–M4, Ask page, deploy index_corpus, CI pgvector image._
