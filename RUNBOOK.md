# The Record — Operator Runbook

## Service Overview

| Service            | Container               | Port | Purpose                                      |
| ------------------ | ----------------------- | ---- | -------------------------------------------- |
| Next.js (web)      | therecord-web           | 3090 | Frontend (nginx proxied)                     |
| NestJS (api)       | therecord-api           | 3091 | Backend API + ingestion                      |
| FastAPI (intel)    | therecord-intelligence  | 8001 | NLP + AI pipeline                            |
| PostgreSQL         | therecord-postgres      | 5432 | Database                                     |

## Health Checks

### Quick status

```bash
docker ps | grep therecord
curl https://therecord.codist.co.za/api/health
```

A healthy API returns JSON such as: `{ "status": "ok", "timestamp": "…", "uptime": … }` (uptime in seconds since process start).

### Full health (operators only)

`GET /api/health/full` requires the `x-health-key` header to match the `HEALTH_API_KEY` environment variable on the API container. Do not expose this endpoint on the public internet without network restrictions and TLS.

```bash
curl -H "x-health-key: $HEALTH_API_KEY" \
     https://therecord.codist.co.za/api/health/full | jq
```

### Check for stale ingestion

```bash
docker logs therecord-api --tail 50 | grep "ingestion"
```

Also use full health: the `checks.ingestion` object includes `last_article_ingested_at`, `hours_since_last_ingest`, and `is_stale` (compared to `STALE_THRESHOLD_HOURS`, default 4 hours).

## Common Operations

### Deploy manually (without GitHub Actions)

```bash
sudo -i -u therecord
cd /opt/therecord
GIT_SSH_COMMAND="ssh -i ~/.ssh/therecord_deploy" git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker image prune -f
```

**Recommended:** run database migrations after pulling and before (or as part of) a controlled rollout. Example:

```bash
docker exec therecord-api npm run migration:run
```

### Run migrations manually

```bash
docker exec therecord-api npm run migration:run
```

### Run seeds (first time or after reset)

After migrations, the recommended one-shot import is the orchestrated index (correct order: commissions master → ad hoc → SIU → Mkhwanazi story and related entities — see `apps/api/src/database/seeds/index.ts`):

```bash
docker exec therecord-api npm run seed:all
```

Individual scripts (use when you know the dependency order):

```bash
docker exec therecord-api npm run seed:commissions
docker exec therecord-api npm run seed:adhoc
docker exec therecord-api npm run seed:siu
docker exec therecord-api npm run seed
```

The `seed` script runs only the Mkhwanazi / Madlanga story seed (`mkhwanazi.seed.ts`). Prefer `seed:all` for a greenfield database.

### Trigger manual article ingest

```bash
curl -X POST https://therecord.codist.co.za/api/ingestion/article \
  -H "content-type: application/json" \
  -H "x-ingestion-key: $INGESTION_API_KEY" \
  -d '{ "headline": "…", "source_name": "Daily Maverick", "source_url": "https://…", "raw_text": "…" }'
```

(Adjust the JSON body to match `IngestArticleDto` in the Nest API; required fields are validated by the API.)

## YouTube discovery

Videos are **never** auto-published: the intelligence service scores candidates; the API persists rows as `pending` until an operator approves them.

**Requirements:** `YOUTUBE_API_KEY` on the **intelligence** container, `INGESTION_API_KEY` for Nest operator routes. Scheduled runs use the same code path as manual discovery (`INGESTION_ENABLED=true` on the API for crons).

**Manual trigger** (substitute your public API host if it differs from production):

```bash
curl -X POST "https://therecord.co.za/api/youtube/discover/commission/<uuid>" \
  -H "x-ingestion-key: $INGESTION_API_KEY"
```

Other entity types: `adhoc_committee`, `story`, `siu_proclamation` (same path pattern).

**Review queue:**

```bash
curl -H "x-ingestion-key: $INGESTION_API_KEY" \
  "https://therecord.co.za/api/youtube/review-queue" | jq
```

**Stats:**

```bash
curl -H "x-ingestion-key: $INGESTION_API_KEY" \
  "https://therecord.co.za/api/youtube/stats" | jq
```

If you change `.env`, **recreate** containers (`docker compose down` then `up`) so Docker picks up new variables; `docker restart` alone does not reload environment files.

### Restart a single service

```bash
docker restart therecord-api
docker restart therecord-intelligence
docker restart therecord-web
```

### View logs

```bash
docker logs therecord-api -f --tail 100
docker logs therecord-intelligence -f --tail 50
docker logs therecord-web -f --tail 50
```

### Database access (emergency only)

```bash
docker exec -it therecord-postgres psql -U therecord -d therecord_db
```

Replace `therecord` / `therecord_db` with the values from your production `.env` if they differ.

### Check ingestion scheduler

Is it enabled?

```bash
docker exec therecord-api env | grep INGESTION_ENABLED
```

Last article ingest time:

```bash
docker exec therecord-postgres psql -U therecord -d therecord_db \
  -c "SELECT MAX(created_at) FROM articles;"
```

(Adjust database name and user to match your deployment.)

## SLOs

| Metric                 | Target                          | Alert if                                               |
| ---------------------- | ------------------------------- | ------------------------------------------------------ |
| API health             | 99% uptime                      | `/api/health` returns non-200 for more than 5 minutes |
| Ingestion freshness    | ≤ 4 hours between new articles  | `/api/health/full` shows `is_stale: true` (threshold)  |
| Intelligence service   | Available for NLP routes        | `/api/health/full` shows `intelligence.status: error`   |
| Story page load        | &lt; 2s (LCP)                   | Measured monthly via Lighthouse or RUM                |

## Ports on Hetzner (therecord user only)

- **3090** — web (nginx proxied to `therecord.codist.co.za`)
- **3091** — API (same host; many setups proxy `/api` to this service)
- **8001** — intelligence (internal to Docker network; not usually exposed on nginx)

**Do not** conflict with:

- **8080** — billable
- **3080** — warroom

## Environment Variables (required for production)

| Variable                 | Notes                                                                 |
| ------------------------ | --------------------------------------------------------------------- |
| `DATABASE_URL`           | PostgreSQL connection string for the API and (where used) intelligence |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Used by `docker compose` for the Postgres service          |
| `NESTJS_PORT`            | Default `3091`                                                        |
| `NEXTJS_PORT`            | Default `3090` (web listens on 3000 inside the container)             |
| `INTELLIGENCE_PORT`      | `8001` inside the intelligence image                                  |
| `INTELLIGENCE_URL`       | e.g. `http://intelligence:8001` (Docker service name)                 |
| `ANTHROPIC_API_KEY`      | Required by the intelligence service for LLM calls                    |
| `YOUTUBE_API_KEY`        | YouTube Data API v3 key on **intelligence** for `/api/youtube/discover` |
| `INGESTION_API_KEY`      | Required for `POST /api/ingestion/*` and operator YouTube routes       |
| `INGESTION_ENABLED`      | Set `true` in production to run the RSS scheduler and YouTube discovery crons |
| `HEALTH_API_KEY`         | Required for `GET /api/health/full`                                    |
| `STALE_THRESHOLD_HOURS`  | Default `4`; used by full health for ingestion staleness              |
| `NODE_ENV`               | `production` in prod                                                  |
| `NEXT_PUBLIC_API_URL`    | Public browser API base, e.g. `https://therecord.codist.co.za/api`   |

Server-side Next.js fetches should use `API_URL` (or equivalent) to reach the API on the Docker network, as defined in your compose and `apps/web` configuration.
