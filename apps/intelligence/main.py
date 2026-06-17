"""FastAPI entry point for The Record Intelligence API.

Routers:
  POST /api/entities/extract   — spaCy NER
  POST /api/legal/map          — crime → SA statute mapping
  POST /api/summary/simplify   — Claude plain-English rewrite
  POST /api/cluster/match      — article → story clustering
  POST /api/youtube/discover  — YouTube search + relevance scoring (operator via Nest)
  POST /api/rag/query         — vector retrieval over indexed corpus (M1)
  POST /api/rag/ask           — retrieve + grounded Claude answer (M2)
  POST /api/relevance/score   — corpus centroid relevance (M3)
  POST /api/entities/link     — mention → canonical entity linking (M4)

Plus:
  GET /health                  — liveness probe for Docker / orchestrators.

Runtime assumptions:
  - `ANTHROPIC_API_KEY` is set (required for /api/summary/simplify).
  - The spaCy `en_core_web_sm` wheel is installed (pinned in requirements.txt).
"""

from __future__ import annotations

import logging
import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Response

import db
from config import get_settings
from routers import cluster, entities, legal, rag, relevance, summary, youtube
from services.nlp_service import get_nlp

# Load .env before logging and lifespan read os.environ.
load_dotenv()

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)-7s %(name)s — %(message)s",
)
logger = logging.getLogger("intelligence")


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Eagerly load spaCy and open the Postgres pool."""
    settings = get_settings()
    logger.info("Intelligence service starting up.")
    get_nlp()
    if not settings.anthropic_api_key:
        logger.warning(
            "ANTHROPIC_API_KEY is not set — /api/summary/simplify will return 503.",
        )
    await db.open_pool()
    yield
    await db.close_pool()
    logger.info("Intelligence service shutting down.")


_settings = get_settings()
_docs_enabled = _settings.app_env != "prod"

app = FastAPI(
    title="The Record Intelligence API",
    description=(
        "NLP, summarisation, legal mapping and story clustering for The Record — "
        "a South African legal intelligence and news timeline platform."
    ),
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if _docs_enabled else None,
    redoc_url="/redoc" if _docs_enabled else None,
)

app.include_router(entities.router, prefix="/api")
app.include_router(legal.router, prefix="/api")
app.include_router(summary.router, prefix="/api")
app.include_router(cluster.router, prefix="/api")
app.include_router(youtube.router, prefix="/api")
app.include_router(rag.router, prefix="/api")
app.include_router(relevance.router, prefix="/api")


@app.get("/health", tags=["health"], summary="Liveness and dependency probe")
async def health(response: Response) -> dict[str, str | bool]:
    """Postgres + pgvector status; does not load embedding models."""
    settings = get_settings()
    try:
        check = await db.healthcheck()
    except Exception as exc:  # noqa: BLE001 — safe 503 payload
        logger.warning("Health check failed: %s", exc)
        response.status_code = 503
        return {
            "status": "degraded",
            "detail": "database unavailable",
        }

    return {
        "status": "ok",
        "app_env": settings.app_env,
        "db": check["db"],
        "pgvector": check["pgvector"],
    }
