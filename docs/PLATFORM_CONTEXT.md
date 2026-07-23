# The Record — Platform & operations context

Single reference for deployment, ports, domains, CI/CD, and env. Keep in sync when infrastructure changes.

---

## Ports and services

| Service | Purpose | Inside Docker | Host (dev compose) |
|---------|---------|---------------|-------------------|
| PostgreSQL | Database | `postgres:5432` | `localhost:5432` |
| NestJS (`apps/api`) | HTTP API | `api:3091` (`NESTJS_PORT`) | `127.0.0.1:3091` → container `:3091` |
| Next.js (`apps/web`) | Frontend (app listens on **3000** in container) | `web:3000` (internal) | `127.0.0.1:3090` → container `:3000` |
| Intelligence (FastAPI) | NLP / Anthropic | `intelligence:8001` | `127.0.0.1:8001` |
| Umami | Privacy-first analytics | `umami:3000` | `127.0.0.1:3095` (optional `--profile analytics`) |

**Production edge:** Nginx on the Hetzner VPS proxies the public site to **`127.0.0.1:3090`** (web container mapping only). API, Postgres, and Intelligence are **not** published on host ports in `docker-compose.prod.yml` (`ports: []` overrides). Umami dashboard: **`analytics.therecord.co.za`** → `127.0.0.1:3095` (nginx example in `docs/nginx/analytics.therecord.co.za.conf.example`).

`.env.example` uses `NEXTJS_PORT=3090` as the **host** mapping convention for documentation; Next inside Docker still listens on port **3000** unless overridden in the Dockerfile.

---

## Domains

| URL | Role |
|-----|------|
| **`https://therecord.codist.co.za`** | Current production-facing site — `metadataBase` in `apps/web/app/layout.tsx`, canonical URLs across pages, `next.config.ts` remote image patterns. |
| **`therecord.co.za`** | Registered; **not** wired as primary in this codebase yet. |

### Cut-over checklist (`therecord.co.za`)

When making it canonical: update DNS + TLS + nginx server names; set `NEXT_PUBLIC_API_URL` to match how browsers reach the API; search/replace hardcoded `https://therecord.codist.co.za` (metadata, OG URLs, redirects); bump `metadataBase`; confirm API is reachable under the same apex or subdomain (e.g. `/api` via reverse proxy or `api.` host).

---

## Environment

- **Source of truth for variable names:** [`.env.example`](../.env.example) at repo root (never commit `.env`).
- **Next split:** **`API_URL`** — server-side RSC/route handlers → Nest (e.g. `http://api:3091` inside Docker). **`NEXT_PUBLIC_API_URL`** — browser → public API origin (e.g. `http://localhost:3091` local, HTTPS prod URL in production compose default).
- **Intelligence:** `ANTHROPIC_API_KEY`, `INTELLIGENCE_URL`.
- **Ingestion / health:** `INGESTION_ENABLED`, `INGESTION_API_KEY`, `HEALTH_API_KEY`, `STALE_THRESHOLD_HOURS` — see `.env.example`.

---

## Docker

| Usage | Command |
|-------|---------|
| Local dev | `docker compose up` (uses `.env`) |
| Rebuild images | `docker compose up --build` |
| Production | `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d` |
| Network | `therecord-network` — isolated (`docker-compose.yml`) |

Prod override strips dev bind mounts, sets `restart: unless-stopped`, keeps only **`127.0.0.1:3090:3000`** for web.

---

## CI / CD (GitHub Actions)

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) | PR + push to `main` | Node 20, `npm ci`, typecheck (web/api/shared-types), lint web/API, API smoke + migrations, intelligence `ruff`/`mypy`, web production build with API on `3091`. |
| [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) | Push to `main` only | SSH to server: `git pull`, `docker exec therecord-api npm run migration:run`, `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`, `docker image prune -f`. |

**Repository secrets:** `SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY`, `APP_DIR` (typically `/opt/therecord`). See comments in `deploy.yml` — deploy key `therecord_deploy` lives **on the server**, not GitHub.

---

## Production server (from `.cursorrules`)

- **Host:** Hetzner VPS `65.109.7.45`
- **App directory:** `/opt/therecord`
- **Unix user:** `therecord`
- **Do not reuse:** Other project Docker networks (`billable-network`, `warroom-network`, etc.)

---

## Product / architecture brain

Higher-level constraints (domains, seeds, commissions vs ad hoc, SIU, search surfaces, stack) live in **[`.cursorrules`](../.cursorrules)** — read that for editorial and data-model rules.

---

## Priority 6.1 accessibility / SEO snapshot (FYI)

Skip link + `#main-content`; focus trap: `hooks/useFocusTrap.ts` on GlobalSearch, MobileNav, Homepage FeaturedStory drawer; reduced-motion globals + component variants; consolidated ARIA for tabs/badges/ticker/metadata; fetch tiers in `apps/web/lib/api.ts` — stories ~300s, stable reference data ~3600s, people/SIU ~900s, search **`cache: 'no-store'`**.

---

_Last updated: aligned with docker-compose.yml, docker-compose.prod.yml, and workflows in-repo._
