"""FastAPI entry point for The Record Intelligence API.

Routers:
  POST /api/entities/extract   — spaCy NER
  POST /api/legal/map          — crime → SA statute mapping
  POST /api/summary/simplify   — Claude plain-English rewrite
  POST /api/cluster/match      — article → story clustering

Plus:
  GET /health                  — liveness probe for Docker / orchestrators.

Runtime assumptions:
  - `ANTHROPIC_API_KEY` is set (required for /api/summary/simplify).
  - The spaCy `en_core_web_sm` wheel is installed (pinned in requirements.txt).
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from dotenv import load_dotenv
from fastapi import FastAPI

# Load .env before reading any os.environ values downstream.
load_dotenv()

from routers import cluster, entities, legal, summary  # noqa: E402  — imports after load_dotenv
from services.nlp_service import get_nlp  # noqa: E402

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)-7s %(name)s — %(message)s",
)
logger = logging.getLogger("intelligence")


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Eagerly load spaCy so the first request doesn't eat the cold-load cost."""
    logger.info("Intelligence service starting up.")
    get_nlp()
    if not os.environ.get("ANTHROPIC_API_KEY"):
        logger.warning(
            "ANTHROPIC_API_KEY is not set — /api/summary/simplify will return 503."
        )
    yield
    logger.info("Intelligence service shutting down.")


app = FastAPI(
    title="The Record Intelligence API",
    description=(
        "NLP, summarisation, legal mapping and story clustering for The Record — "
        "a South African legal intelligence and news timeline platform."
    ),
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.include_router(entities.router, prefix="/api")
app.include_router(legal.router, prefix="/api")
app.include_router(summary.router, prefix="/api")
app.include_router(cluster.router, prefix="/api")


@app.get("/health", tags=["health"], summary="Liveness probe")
async def health() -> dict[str, str]:
    return {"status": "ok"}
