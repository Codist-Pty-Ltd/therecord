"""Async PostgreSQL pool with pgvector type registration."""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator, Mapping, Sequence
from contextlib import asynccontextmanager
from typing import Any

from psycopg_pool import AsyncConnectionPool

from config import get_settings

logger = logging.getLogger(__name__)

_pool: AsyncConnectionPool | None = None


async def _configure_connection(conn: Any) -> None:
    """Register pgvector on each pooled connection when the extension is available."""
    try:
        from pgvector.psycopg import register_vector_async

        await register_vector_async(conn)
    except Exception as exc:  # noqa: BLE001 — pool startup must survive missing extension
        logger.warning("pgvector type registration skipped: %s", exc)


async def open_pool() -> None:
    """Create and open the async connection pool."""
    global _pool
    if _pool is not None:
        return

    settings = get_settings()
    _pool = AsyncConnectionPool(
        conninfo=settings.database_url,
        min_size=settings.db_pool_min,
        max_size=settings.db_pool_max,
        open=False,
        configure=_configure_connection,
    )
    await _pool.open()
    logger.info(
        "Database pool opened (min=%s max=%s)",
        settings.db_pool_min,
        settings.db_pool_max,
    )


async def close_pool() -> None:
    """Close and clear the async connection pool."""
    global _pool
    if _pool is None:
        return
    await _pool.close()
    _pool = None
    logger.info("Database pool closed")


@asynccontextmanager
async def connection() -> AsyncIterator[Any]:
    """Yield a connection from the pool."""
    if _pool is None:
        raise RuntimeError("Database pool is not open")
    async with _pool.connection() as conn:
        yield conn


async def healthcheck() -> dict[str, str | bool]:
    """
    Verify database connectivity and whether the pgvector extension is installed.

    Raises on connection/query failure so callers can return HTTP 503.
    """
    async with connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT 1")
            await cur.execute(
                "SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector')",
            )
            row = await cur.fetchone()
            pgvector_installed = bool(row[0]) if row else False

    return {"db": "ok", "pgvector": pgvector_installed}


async def fetch(
    sql: str,
    params: Sequence[Any] | Mapping[str, Any] | None = None,
) -> list[tuple[Any, ...]]:
    """Run a read query and return all rows."""
    async with connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(sql, params)
            rows = await cur.fetchall()
            return list(rows)


async def execute(
    sql: str,
    params: Sequence[Any] | Mapping[str, Any] | None = None,
) -> None:
    """Run a write query."""
    async with connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(sql, params)
        await conn.commit()
