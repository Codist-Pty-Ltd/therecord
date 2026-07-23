# The Record

South African legal intelligence and accountability platform — connecting incidents, investigations, commissions, SIU proclamations, and outcomes in plain English.

**Production:** [therecord.codist.co.za](https://therecord.codist.co.za) · **Stack:** Next.js · NestJS · FastAPI · PostgreSQL (pgvector)

---

## What it does

The Record tracks accountability stories from incident through charges and court to outcome. It maps events to the Constitution and statutes (PRECCA, PFMA, POCA, and others), explains legal concepts at three reading levels, and surfaces commissions, ad hoc committees, SIU recovery, state entities, and human-impact sectors.

Not just news — a structured record of who was investigated, what was found, and whether anyone was held accountable.

---

## Architecture

| Service | Path | Container | Dev port | Role |
|---------|------|-----------|----------|------|
| **Web** | `apps/web` | `therecord-web` | **3090** | Next.js 15 frontend |
| **API** | `apps/api` | `therecord-api` | **3091** | NestJS REST API, ingestion, TypeORM |
| **Intelligence** | `apps/intelligence` | `therecord-intelligence` | **8001** | FastAPI — RAG, NLP, relevance, entity linking |
| **Shared types** | `packages/shared-types` | — | — | TypeScript contracts shared by web + API |
| **Database** | — | `therecord-postgres` | **5432** | PostgreSQL 16 + **pgvector** |
| **Umami** | `docs/nginx/` example | `therecord-umami` | **3095** | Self-hosted analytics (optional `--profile analytics`) |

Nest proxies the intelligence layer at `POST /api/intelligence/ask`. The web **Ask The Record** page (`/ask`) calls that route and renders grounded answers with citation links.

```
Browser → Next.js (:3090)
       → NestJS (:3091) → FastAPI (:8001, internal in prod)
       → PostgreSQL (stories, commissions, doc_chunk vectors, …)
       → Umami (:3095, optional) ← analytics.therecord.co.za
```

---

## Quick start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) + Docker Compose v2
- Node 20+ (for local workspace scripts outside Docker)
- Copy [`.env.example`](./.env.example) → `.env` and set secrets (especially `ANTHROPIC_API_KEY` for grounded Q&A)

### Run locally

```bash
cp .env.example .env   # edit as needed
npm install
docker compose up --build
```

| URL | Purpose |
|-----|---------|
| http://localhost:3090 | Web app |
| http://localhost:3090/ask | Ask The Record (grounded Q&A) |
| http://localhost:3091/api/health | API health |
| http://localhost:3091/graphql | GraphQL playground (**dev only**) |
| http://localhost:8001/docs | FastAPI Swagger (**dev only** — disabled when `APP_ENV=prod`) |

> Compose maps host **3090 → container 3000**. Do not use `localhost:3000` unless you run Next outside Docker.

### First-time database setup

After containers are up:

```bash
docker exec therecord-api npm run migration:run
docker exec therecord-api npm run seed:all
docker exec therecord-intelligence python -m jobs.index_corpus
```

Re-indexing is idempotent and runs automatically on production deploy after migrations.

---

## Development

### Root scripts

```bash
npm run dev:docker       # docker compose up (full stack)
npm run dev              # turbo: Next.js + NestJS dev servers in parallel
npm run build            # turbo: build all JS packages (cached)
npm run test             # turbo: run tests in all packages
npm run lint             # turbo: lint all packages
npm run typecheck        # turbo: typecheck all packages
npm run dev:build        # docker compose up --build
```

### Workspace scripts

```bash
npm run dev:web --workspace=@therecord/web
npm run start:dev --workspace=@therecord/api
```

### Intelligence (Python)

```bash
cd apps/intelligence
pip install -r requirements-dev.txt
pytest -q
ruff check .
```

Fastest intelligence smoke (no UI): open http://localhost:8001/docs and try **`POST /api/rag/ask`**.

See **[PYTHON_RUNBOOK.md](./PYTHON_RUNBOOK.md)** for the full Python guide — jobs, env vars, manual curl tests, and Phase 2 relevance training.

---

## GraphQL (read-only)

In development, the Nest API exposes a **read-only GraphQL** layer alongside REST at **`http://localhost:3091/graphql`** (Apollo Playground). REST routes under `/api/*` are unchanged.

Example — full accountability picture for one commission (people + timeline events in one request):

```graphql
query CommissionDetail($id: ID!) {
  commission(id: $id) {
    id
    name
    chairName
    status
    people {
      id
      name
      role
    }
    events {
      id
      description
      dateMentioned
    }
  }
}
```

Nested fields use **DataLoader** batching so resolving `people` on many commissions does not trigger N+1 SQL queries.

In production (`NODE_ENV=production`), GraphQL **introspection and the playground are disabled**; the schema file is generated at `apps/api/src/schema.gql` on build.

---

## Testing & CI

| Layer | Command | CI job |
|-------|---------|--------|
| TypeScript | `npm run typecheck` | `typecheck` (Turborepo) |
| Lint | `npm run lint` | `lint` (Turborepo) |
| API smoke | `npm run test:smoke --workspace=apps/api` | `api-smoke-test` |
| Intelligence | `cd apps/intelligence && pytest -q` | `intelligence-lint` (+ ruff, mypy) |
| Web build | `npm run build --workspace=apps/web` | `web-build` |

CI runs on pull requests and pushes to `main`. Deploy runs on push to `main` only.

---

## Commit messages

Use a short **type prefix** so deploy history and the footer build line stay readable:

| Prefix | Use for |
|--------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `content:` | New story or commission editorial |
| `data:` | Seed / corpus data update |
| `chore:` | Maintenance, deps, CI |

Example: `content: Add Zondo Commission final report analysis`

---

## Analytics (Umami)

Self-hosted, cookieless analytics — POPIA-friendly. Optional locally; enabled in production with the `analytics` Compose profile.

```bash
# Set UMAMI_* vars in .env (see .env.example), then:
docker compose --profile analytics up -d umami umami-db
```

- Dashboard: `https://analytics.therecord.co.za` (nginx example in `docs/nginx/`)
- Script env: `NEXT_PUBLIC_UMAMI_SCRIPT_URL`, `NEXT_PUBLIC_UMAMI_WEBSITE_ID`
- RSS feed for readers: `GET /api/feed.xml`

See `docs/CONTENT_PIPELINE.md` for monitoring sources and the content-queue roadmap.

---

## Deploy

Production uses Docker Compose on a Hetzner VPS:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

GitHub Actions ([`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)) SSHs to the server, pulls `main`, rebuilds, runs migrations, indexes the RAG corpus, and health-checks the site.

**Operator docs:**

- **[RUNBOOK.md](./RUNBOOK.md)** — health checks, migrations, seeds, troubleshooting
- **[docs/PLATFORM_CONTEXT.md](./docs/PLATFORM_CONTEXT.md)** — ports, domains, CI secrets, env split (`API_URL` vs `NEXT_PUBLIC_API_URL`)
- **[PYTHON_RUNBOOK.md](./PYTHON_RUNBOOK.md)** — intelligence service ops

Before changing Docker, nginx, workflows, or public URLs, read `docs/PLATFORM_CONTEXT.md`.

---

## Repository layout

```
apps/
  web/              Next.js App Router frontend
  api/              NestJS API, entities, migrations, seeds
  intelligence/     FastAPI NLP + RAG pipeline
packages/
  shared-types/     Shared TypeScript types and helpers
docs/               Platform and editorial reference
.github/workflows/  CI and deploy
docker-compose.yml  Local + prod base compose
```

Product rules, data model, seed order, and editorial constraints live in **[`.cursorrules`](./.cursorrules)**.

---

## Environment

Variable names and defaults: **[`.env.example`](./.env.example)**. Never commit `.env`.

Key splits:

- **`API_URL`** — server-side Next.js → Nest (Docker: `http://api:3091`)
- **`NEXT_PUBLIC_API_URL`** — browser → public API origin
- **`INTELLIGENCE_URL`** — Nest → FastAPI (Docker: `http://intelligence:8001`)
- **`DATABASE_URL`** — shared by API and intelligence; URL-encode special characters in passwords (e.g. `#` → `%23`)

---

## License

Private — Codist. All rights reserved.
