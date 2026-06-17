"""Pytest configuration — event loop policy for psycopg async on Windows."""

from __future__ import annotations

import asyncio
import os
import sys
from collections.abc import AsyncIterator, Iterator
from uuid import UUID, uuid4

import psycopg
import pytest
from testcontainers.postgres import PostgresContainer

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

pytest_plugins = ("pytest_asyncio",)

# Same SQL as apps/api migration AddDocChunkAndPgvector1747600000000.up()
DOC_CHUNK_MIGRATION_SQL = """
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS "doc_chunk" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "source_type" text NOT NULL,
  "source_id" uuid NOT NULL,
  "chunk_index" int NOT NULL,
  "content" text NOT NULL,
  "embedding" vector(384),
  "content_hash" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "doc_chunk_source_chunk_uidx"
    UNIQUE ("source_type", "source_id", "chunk_index")
);

CREATE INDEX IF NOT EXISTS "doc_chunk_embedding_idx"
ON "doc_chunk" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS "doc_chunk_source_idx"
ON "doc_chunk" ("source_type", "source_id");
"""


def to_psycopg_url(url: str) -> str:
    return url.replace("postgresql+psycopg2://", "postgresql://").replace(
        "postgresql+psycopg://",
        "postgresql://",
    )


def apply_doc_chunk_migration(database_url: str) -> None:
    with psycopg.connect(database_url, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(DOC_CHUNK_MIGRATION_SQL)


RELEVANCE_LABEL_MIGRATION_SQL = """
CREATE TABLE IF NOT EXISTS "relevance_label" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "video_id" text NOT NULL,
  "title" text,
  "channel" text,
  "text" text NOT NULL,
  "score" double precision NOT NULL,
  "method" text NOT NULL,
  "heuristic_score" double precision,
  "human_label" boolean,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "relevance_label_video_uidx" UNIQUE ("video_id")
);

CREATE INDEX IF NOT EXISTS "relevance_label_human_label_idx"
ON "relevance_label" ("human_label");
"""

ENTITY_LINK_CANDIDATE_MIGRATION_SQL = """
CREATE TABLE IF NOT EXISTS "entity_link_candidate" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "mention" text NOT NULL,
  "entity_type" text NOT NULL,
  "source_type" text,
  "source_id" uuid,
  "suggested_id" uuid,
  "suggested_name" text,
  "confidence" double precision NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "entity_link_candidate_status_idx"
ON "entity_link_candidate" ("status");

CREATE INDEX IF NOT EXISTS "entity_link_candidate_source_idx"
ON "entity_link_candidate" ("source_type", "source_id");
"""


def apply_relevance_label_migration(database_url: str) -> None:
    with psycopg.connect(database_url, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(RELEVANCE_LABEL_MIGRATION_SQL)


def apply_entity_link_candidate_migration(database_url: str) -> None:
    with psycopg.connect(database_url, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(ENTITY_LINK_CANDIDATE_MIGRATION_SQL)


def apply_intelligence_migrations(database_url: str) -> None:
    apply_doc_chunk_migration(database_url)
    apply_relevance_label_migration(database_url)
    apply_entity_link_candidate_migration(database_url)


def unit_vector(dim: int, axis: int) -> list[float]:
    """384-d unit vector along the given axis (for deterministic retrieval tests)."""
    vec = [0.0] * dim
    vec[axis] = 1.0
    return vec


def insert_doc_chunk(
    database_url: str,
    *,
    source_type: str,
    source_id: UUID,
    chunk_index: int,
    content: str,
    embedding: list[float],
    content_hash: str = "test-hash",
    chunk_id: UUID | None = None,
) -> UUID:
    row_id = chunk_id or uuid4()
    with psycopg.connect(database_url, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO doc_chunk (
                    id, source_type, source_id, chunk_index, content,
                    content_hash, embedding
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s::vector)
                """,
                (
                    row_id,
                    source_type,
                    source_id,
                    chunk_index,
                    content,
                    content_hash,
                    embedding,
                ),
            )
    return row_id


@pytest.fixture()
def pgvector_database_url() -> Iterator[str]:
    with PostgresContainer("pgvector/pgvector:pg16") as postgres:
        database_url = to_psycopg_url(postgres.get_connection_url())
        apply_intelligence_migrations(database_url)

        os.environ["DATABASE_URL"] = database_url
        os.environ["APP_ENV"] = "dev"

        from config import get_settings

        get_settings.cache_clear()

        yield database_url

        get_settings.cache_clear()


@pytest.fixture()
async def pgvector_pool(pgvector_database_url: str) -> AsyncIterator[None]:
    import db

    await db.open_pool()
    try:
        yield
    finally:
        await db.close_pool()
