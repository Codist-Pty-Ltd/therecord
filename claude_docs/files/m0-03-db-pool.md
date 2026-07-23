# M0-03 · Async Postgres pool + pgvector registration

**Produces:** `apps/intelligence/db.py`. **Depends on:** M0-02. **Verify:** pool
opens locally against a Postgres with the migration applied; `healthcheck()`
returns `pgvector: true`.

```
Create apps/intelligence/db.py: an async Postgres layer using psycopg v3 and
psycopg_pool.AsyncConnectionPool, with pgvector registered per connection.

Requirements:
- Module-level pool plus async open_pool() / close_pool() used by the app
  lifespan. Build from get_settings().database_url with min_size=db_pool_min,
  max_size=db_pool_max, open=False; open explicitly in open_pool().
- Register pgvector on each new connection via the pool's `configure` async
  hook using pgvector.psycopg.register_vector_async. If the vector extension is
  not yet present, do NOT crash pool startup — catch, log a warning, continue.
- async context manager connection() yielding a pooled connection.
- async def healthcheck() -> dict: run "SELECT 1"; check pg_extension for
  'vector'; return {"db":"ok","pgvector": <bool>}. On DB failure, raise.
- async def fetch(sql, params) / execute(sql, params) thin helpers if it keeps
  call sites clean — optional.
Full type hints, docstrings, logging (no print). No ORM.
```
