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

After migrations, the recommended one-shot import is the orchestrated index (order: commissions master → reports → recommendations → ad hoc → SIU → impact-sectors → state-entities → accountability-bodies → cape-town → mkhwanazi → **new-stories-2026** — see `apps/api/src/database/seeds/index.ts`):

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

**2026 corpus** (Tembisa Hospital, Medicare24/Carrim, Madlanga timeline extensions): runs automatically at the end of `seed:all`. To run only that step after a build (must run after mkhwanazi / full graph):

```bash
docker exec therecord-api node dist/database/seeds/new-stories-2026.seed.js
```

```bash
curl -X POST https://therecord.codist.co.za/api/ingestion/article \
  -H "content-type: application/json" \
  -H "x-ingestion-key: $INGESTION_API_KEY" \
  -d '{"headline":"…","source_name":"Daily Maverick","source_url":"https://…","published_at":"2026-01-15T10:00:00.000Z","content_snippet":"…","full_text":"…"}'
```

(Adjust the JSON body to match `IngestArticleDto` in the Nest API; required fields are validated by the API.)

## Provincial Stories & Money Counter

Provincial sample data (Western Cape / City of Cape Town narratives) ships in a dedicated seed. Run it after the main orchestrated import so provinces and base stories exist:

```bash
docker exec therecord-api node dist/database/seeds/cape-town-stories.seed.js
```

Verify the homepage money counter aggregates tracked expenditure (JSON field name matches the live API):

```bash
curl https://therecord.co.za/api/expenditure/counter | jq '.total_tracked_rands'
```

List provinces:

```bash
curl https://therecord.co.za/api/provinces | jq '.[].name'
```

**Add or enrich a story with provincial scope via ingestion:** include optional slugs and category in the JSON body. The API resolves province and municipality by slug and sets them on the story.

```json
{
  "headline": "…",
  "source_name": "…",
  "source_url": "https://…",
  "published_at": "2026-01-15T10:00:00.000Z",
  "content_snippet": "…",
  "full_text": "…",
  "province_slug": "western-cape",
  "municipality_slug": "city-of-cape-town",
  "story_category": "tender_fraud"
}
```

If both `province_slug` and `municipality_slug` are sent, the municipality must belong to that province or the API returns `400 Bad Request`.

### Phase 4 — After GitHub Actions (provincial rollout)

SSH to the server, then:

```bash
sudo -i -u therecord
cd /opt/therecord/app
```

**Migration** (production image — runs compiled migration runner; equivalent to `npm run migration:run:prod` inside the container):

```bash
docker exec therecord-api node dist/database/run-migrations.js
```

**Provincial seed** (Cape Town narratives, expenditure rows, similar-story links; provinces and municipalities are already created by migration `AddProvincialAccountability`):

```bash
docker exec therecord-api node dist/database/seeds/cape-town-stories.seed.js
```

**Verify provinces (expect 9 rows):**

```bash
docker exec therecord-postgres psql -U therecord -d therecord_db \
  -c "SELECT name, slug FROM provinces ORDER BY name;"
```

**Verify expenditure records:**

```bash
docker exec therecord-postgres psql -U therecord -d therecord_db \
  -c "SELECT s.title, e.amount_rands, e.expenditure_type
      FROM public_expenditure_records e
      JOIN stories s ON s.id = e.story_id
      ORDER BY e.amount_rands DESC;"
```

**Money counter** (on-host API port):

```bash
curl http://127.0.0.1:3091/api/expenditure/counter | jq '.total_tracked_rands'
```

**Homepage** (web container):

```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3090/
```

Expect `200`. If any step fails: `docker logs therecord-api --tail 100`.

### Phase 4 — Public smoke tests (provincial API)

From any machine with `curl` and `jq`:

```bash
# Province index — expect 9
curl https://therecord.co.za/api/provinces | jq 'length'

# Cape Town municipality (`name` is the official full title; `short_name` is the common label)
curl https://therecord.co.za/api/municipalities/city-of-cape-town | jq '.short_name'
# Should be "Cape Town"

# Western Cape stories (paginated) — expect at least 2
curl "https://therecord.co.za/api/provinces/western-cape/stories" | jq '.data | length'

# Similar stories for Cape Town tender story — expect > 0
curl "https://therecord.co.za/api/stories/cape-town-r1-6bn-tender-fraud-2025/similar" | jq 'length'

# Money counter summary
curl https://therecord.co.za/api/expenditure/counter | jq '{
  total: .total_tracked_rands,
  stories: .story_count,
  provinces: .province_count
}'
```

If a check fails, inspect API logs on the server (`docker logs therecord-api --tail 100`) before escalating.

## Money Counter Integrity

Check money counter data quality:

```bash
docker exec therecord-postgres psql -U therecord -d therecord_db -c "
  SELECT
    expenditure_type,
    COUNT(*) as records,
    SUM(amount_rands) as total
  FROM public_expenditure_records
  WHERE is_primary_record = true
  GROUP BY expenditure_type
  ORDER BY total DESC;"
```

Check for data errors (wrong type combinations):

```bash
docker exec therecord-postgres psql -U therecord -d therecord_db -c "
  SELECT id, amount_rands, expenditure_type, amount_qualifier
  FROM public_expenditure_records
  WHERE (amount_qualifier = 'under_investigation' AND expenditure_type = 'stolen')
     OR amount_rands IS NULL
     OR amount_rands = 0;"
```

Verify total:

```bash
curl https://therecord.co.za/api/expenditure/counter | jq '{
  tracked: .total_tracked_rands,
  under_investigation: .total_under_investigation_rands,
  recovered: .total_recovered_rands,
  disclaimer: .disclaimer
}'
```

## Phase 5 — Accountability bodies deploy (Scorpions, Hawks, IDAC)

**Migration order:** in `apps/api/src/database/migrations`, `1746600000000-AddAccountabilityBodies.ts` runs before `1746900000000-AddExpenditurePrimaryRecordFlag.ts` (primary-record flag for the money counter). Both timestamps are after all existing migrations in the repo.

**Pre-commit (developers, before pushing):**

```bash
npm run typecheck --workspaces --if-present
npm run lint --workspaces --if-present
cd apps/intelligence && ruff check . && mypy . --ignore-missing-imports
```

**Post-deploy (SSH as `therecord` user on production):**

```bash
# Migrations (compiled runner in production image)
docker exec therecord-api node dist/database/run-migrations.js

# Accountability bodies + Scorpions story, cases, Khampepe link, expenditure rows
docker exec therecord-api node dist/database/seeds/accountability-bodies.seed.js

# Verify bodies
docker exec therecord-postgres psql -U therecord -d therecord_db \
  -c "SELECT popular_name, status, conviction_rate_percentage FROM accountability_bodies;"
# Expect: The Scorpions (disbanded, 93.10), The Hawks (active, 50.00), IDAC (active, null)

# Verify cases
docker exec therecord-postgres psql -U therecord -d therecord_db \
  -c "SELECT case_name, outcome FROM accountability_body_cases ORDER BY case_year_start;"
# Expect 7 Scorpions cases

# Verify Khampepe link
docker exec therecord-postgres psql -U therecord -d therecord_db \
  -c "SELECT c.popular_name, ab.popular_name AS subject_body
      FROM commissions c
      LEFT JOIN accountability_bodies ab ON c.subject_body_id = ab.id
      WHERE ab.id IS NOT NULL;"
# Expect: Khampepe Commission → The Scorpions

# Money counter disclaimer (must not be null)
curl http://127.0.0.1:3091/api/expenditure/counter | jq '.disclaimer'

# Smoke — web routes
curl -s -o /dev/null -w "%{http_code}\n" \
  https://therecord.co.za/accountability-bodies/scorpions-dso
# Expect 200

curl -s -o /dev/null -w "%{http_code}\n" \
  https://therecord.co.za/accountability-bodies
# Expect 200

# Comparison API
curl "https://therecord.co.za/api/accountability-bodies/compare?bodies=scorpions-dso,hawks-dpci,idac" \
  | jq '[.bodies[] | {name: .popular_name, rate: .conviction_rate_percentage}]'
# Expect Scorpions 93.1, Hawks 50.0, IDAC null
```

## State Entities

SOE rows (`state_entities`), timelines (`state_entity_timeline`), and cross-links (`state_entity_commission_links`) ship in a dedicated seed. Run after migrations and after `impact-sectors` if importing manually; **`npm run seed:all`** already runs the correct order.

**Run SOE seed only** (production image — compiled path):

```bash
docker exec therecord-api node dist/database/seeds/state-entities.seed.js
```

**Verify rows and health scores:**

```bash
docker exec therecord-postgres psql -U therecord -d therecord_db \
  -c "SELECT popular_name, health_score, is_in_crisis, status FROM state_entities ORDER BY health_score ASC;"
```

**Stats endpoint** (on-host API):

```bash
curl http://127.0.0.1:3091/api/state-entities/stats | jq '{
  total: .total_entities,
  in_crisis: .in_crisis,
  total_bailouts: .total_bailouts_rands
}'
```

### Post-deploy (production)

After `docker compose … up` and migrations:

```bash
docker exec therecord-api node dist/database/run-migrations.js
docker exec therecord-api node dist/database/seeds/state-entities.seed.js
```

**Verify 10 SOEs loaded:**

```bash
docker exec therecord-postgres psql -U therecord -d therecord_db \
  -c "SELECT COUNT(*) FROM state_entities;"
# Expect 10
```

**Verify Eskom timeline:**

```bash
docker exec therecord-postgres psql -U therecord -d therecord_db \
  -c "SELECT year, title FROM state_entity_timeline
      WHERE state_entity_id = (SELECT id FROM state_entities WHERE slug='eskom')
      ORDER BY year;"
```

**Verify commission / SIU / ad hoc links on the API** (detail payload uses `accountability_links`):

```bash
curl http://127.0.0.1:3091/api/state-entities/eskom | jq '.accountability_links | length'
# Should be > 0
```

**Verify public SOE routes:**

```bash
curl -s -o /dev/null -w "%{http_code}" https://therecord.co.za/state-entities
# 200

curl -s -o /dev/null -w "%{http_code}" https://therecord.co.za/state-entities/eskom
# 200

curl -s -o /dev/null -w "%{http_code}" https://therecord.co.za/state-entities/prasa
# 200
```

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
