"""CLI batch job: chunk + embed The Record corpus into doc_chunk."""

from __future__ import annotations

import argparse
import asyncio
import logging
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from typing import Any
from uuid import UUID

import db
from core.chunking import chunk_text, content_hash
from core.embeddings import embed_texts

logger = logging.getLogger(__name__)

EMBED_BATCH_SIZE = 64

SourceRow = tuple[Any, ...]


@dataclass(frozen=True)
class CorpusSource:
    """Maps a Postgres table to RAG source_type + indexable text."""

    source_type: str
    sql: str
    build_text: Callable[[SourceRow], str]


def _join_parts(*parts: str | None) -> str:
    return "\n\n".join(p.strip() for p in parts if p and p.strip())


def _story_text(row: SourceRow) -> str:
    _id, title, summary, plain = row
    return _join_parts(title, summary, plain)


def _commission_text(row: SourceRow) -> str:
    _id, popular, full, reason, plain, outcome = row
    return _join_parts(popular, full, reason, plain, outcome)


def _person_text(row: SourceRow) -> str:
    _id, full_name, role, org, profile, aliases = row
    alias_text = ", ".join(aliases) if aliases else None
    header = " — ".join(p for p in [full_name, role, org] if p)
    return _join_parts(header, alias_text, profile)


def _timeline_text(row: SourceRow) -> str:
    _id, event_date, event_type, title, description, plain = row
    header = f"{event_date} ({event_type}): {title}"
    return _join_parts(header, description, plain)


def _siu_text(row: SourceRow) -> str:
    _id, title, full_title, scope, plain = row
    return _join_parts(title, full_title, scope, plain)


CORPUS_SOURCES: dict[str, CorpusSource] = {
    "story": CorpusSource(
        source_type="story",
        sql="""
            SELECT id, title, summary, plain_english_summary
            FROM stories
            ORDER BY updated_at DESC
        """,
        build_text=_story_text,
    ),
    "commission": CorpusSource(
        source_type="commission",
        sql="""
            SELECT id, popular_name, full_name, reason_summary,
                   plain_english_summary, outcome_summary
            FROM commissions
            ORDER BY updated_at DESC
        """,
        build_text=_commission_text,
    ),
    "person": CorpusSource(
        source_type="person",
        sql="""
            SELECT id, full_name, current_role, organisation,
                   profile_summary, aliases
            FROM people
            ORDER BY updated_at DESC
        """,
        build_text=_person_text,
    ),
    "timeline_event": CorpusSource(
        source_type="timeline_event",
        sql="""
            SELECT id, event_date::text, event_type::text, title,
                   description, plain_english
            FROM timeline_events
            ORDER BY event_date DESC
        """,
        build_text=_timeline_text,
    ),
    "siu": CorpusSource(
        source_type="siu",
        sql="""
            SELECT id, title, full_title, investigation_scope,
                   plain_english_summary
            FROM siu_proclamations
            ORDER BY updated_at DESC
        """,
        build_text=_siu_text,
    ),
}


@dataclass
class IndexStats:
    indexed: int = 0
    skipped: int = 0
    updated: int = 0
    deleted: int = 0


async def _existing_hashes(
    source_type: str,
    source_id: UUID,
) -> dict[int, str]:
    rows = await db.fetch(
        """
        SELECT chunk_index, content_hash
        FROM doc_chunk
        WHERE source_type = %s AND source_id = %s
        """,
        (source_type, source_id),
    )
    return {int(row[0]): str(row[1]) for row in rows}


async def _upsert_chunk(
    conn: Any,
    *,
    source_type: str,
    source_id: UUID,
    chunk_index: int,
    content: str,
    digest: str,
    embedding: list[float],
) -> None:
    async with conn.cursor() as cur:
        await cur.execute(
            """
            INSERT INTO doc_chunk (
                source_type, source_id, chunk_index, content, content_hash, embedding
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (source_type, source_id, chunk_index)
            DO UPDATE SET
                content = EXCLUDED.content,
                content_hash = EXCLUDED.content_hash,
                embedding = EXCLUDED.embedding
            """,
            (source_type, source_id, chunk_index, content, digest, embedding),
        )


async def _delete_stale_chunks(
    conn: Any,
    *,
    source_type: str,
    source_id: UUID,
    keep_count: int,
) -> int:
    async with conn.cursor() as cur:
        await cur.execute(
            """
            DELETE FROM doc_chunk
            WHERE source_type = %s AND source_id = %s AND chunk_index >= %s
            """,
            (source_type, source_id, keep_count),
        )
        return cur.rowcount or 0


async def _index_document(
    source: CorpusSource,
    row: SourceRow,
    *,
    dry_run: bool,
    stats: IndexStats,
) -> None:
    source_id = row[0]
    text = source.build_text(row).strip()
    if not text:
        return

    chunks = chunk_text(text)
    if not chunks:
        return

    existing = await _existing_hashes(source.source_type, source_id)

    pending: list[tuple[int, str, str]] = []
    for index, chunk in enumerate(chunks):
        digest = content_hash(chunk)
        if existing.get(index) == digest:
            stats.skipped += 1
            continue
        pending.append((index, chunk, digest))

    if dry_run:
        stats.updated += len(pending)
        if len(chunks) < len(existing):
            stats.deleted += len(existing) - len(chunks)
        return

    embeddings: list[list[float]] = []
    if pending:
        texts = [item[1] for item in pending]
        for start in range(0, len(texts), EMBED_BATCH_SIZE):
            batch = texts[start : start + EMBED_BATCH_SIZE]
            embeddings.extend(embed_texts(batch))

    async with db.connection() as conn:
        async with conn.transaction():
            for (index, chunk, digest), vector in zip(pending, embeddings, strict=True):
                await _upsert_chunk(
                    conn,
                    source_type=source.source_type,
                    source_id=source_id,
                    chunk_index=index,
                    content=chunk,
                    digest=digest,
                    embedding=vector,
                )
                if index in existing:
                    stats.updated += 1
                else:
                    stats.indexed += 1

            removed = await _delete_stale_chunks(
                conn,
                source_type=source.source_type,
                source_id=source_id,
                keep_count=len(chunks),
            )
            stats.deleted += removed


async def _index_source(
    source: CorpusSource,
    *,
    limit: int | None,
    dry_run: bool,
) -> IndexStats:
    stats = IndexStats()
    sql = source.sql
    if limit is not None:
        sql = f"{sql.strip()} LIMIT {int(limit)}"

    rows = await db.fetch(sql)
    logger.info("Indexing %s: %s rows", source.source_type, len(rows))

    for row in rows:
        await _index_document(source, row, dry_run=dry_run, stats=stats)

    return stats


async def run_index(
    *,
    source_types: Sequence[str] | None,
    limit: int | None,
    dry_run: bool,
) -> None:
    """Index one or all corpus source types."""
    await db.open_pool()
    try:
        selected = (
            [CORPUS_SOURCES[key] for key in source_types]
            if source_types
            else list(CORPUS_SOURCES.values())
        )

        totals = IndexStats()
        for source in selected:
            stats = await _index_source(source, limit=limit, dry_run=dry_run)
            totals.indexed += stats.indexed
            totals.skipped += stats.skipped
            totals.updated += stats.updated
            totals.deleted += stats.deleted
            logger.info(
                "%s: indexed=%s skipped=%s updated=%s deleted=%s",
                source.source_type,
                stats.indexed,
                stats.skipped,
                stats.updated,
                stats.deleted,
            )

        if not dry_run:
            await db.execute("ANALYZE doc_chunk")
            logger.info("ANALYZE doc_chunk complete")
            from core.relevance import refresh_centroid

            await refresh_centroid()

        logger.info(
            "Done (dry_run=%s): indexed=%s skipped=%s updated=%s deleted=%s",
            dry_run,
            totals.indexed,
            totals.skipped,
            totals.updated,
            totals.deleted,
        )
    finally:
        await db.close_pool()


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Index The Record corpus into doc_chunk")
    parser.add_argument(
        "--source-type",
        action="append",
        choices=sorted(CORPUS_SOURCES.keys()),
        help="Index only this source type (repeatable)",
    )
    parser.add_argument("--limit", type=int, default=None, help="Limit rows per source type")
    parser.add_argument("--dry-run", action="store_true", help="Count work without writing")
    return parser.parse_args()


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)-7s %(name)s — %(message)s",
    )
    args = _parse_args()
    asyncio.run(
        run_index(
            source_types=args.source_type,
            limit=args.limit,
            dry_run=args.dry_run,
        ),
    )


if __name__ == "__main__":
    main()
