# M0-04 · Upgrade `/health` + wire pool into lifespan

**Produces:** DB-aware `/health`, pool opened/closed with the app. **Depends on:**
M0-03. **Verify:** `curl :8001/health` returns db + pgvector status.

```
Wire the Postgres pool into the existing FastAPI app in apps/intelligence and
upgrade the health check. Do NOT rewrite the app or touch existing routers'
behaviour.

1. In main.py, add an async lifespan (or extend the existing
   startup/shutdown hooks if the app already uses them) that calls
   db.open_pool() on startup and db.close_pool() on shutdown. Keep existing
   startup work intact.

2. Replace the current liveness-only GET /health so it calls db.healthcheck().
   - Success: 200 {"status":"ok","app_env":<env>,"db":"ok","pgvector":<bool>}.
   - DB failure: 503 {"status":"degraded","detail":<safe message>} — never leak
     the connection string or a stack trace.
   Keep it FAST: the embedding model must NOT be imported or loaded here.

3. Do not change the port (:8001) or the /api prefix conventions.
Keep main.py thin — health logic delegates to db.healthcheck().
```
