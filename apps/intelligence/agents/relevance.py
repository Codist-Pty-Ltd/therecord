"""Shared relevance scoring for content monitoring agents."""

from __future__ import annotations

import json
import logging
import os
import re

import db

logger = logging.getLogger(__name__)

HIGH_KEYWORDS = (
    "proclamation",
    "investigation",
    "corruption",
    "irregular expenditure",
    "state capture",
    "warrant",
    "accountability",
    "public funds",
    "special investigating unit",
    "siu",
)

MIN_RELEVANCE = float(os.environ.get("AGENT_MIN_RELEVANCE", "0.4"))


async def is_already_tracked(title: str, source_url: str | None) -> bool:
    """Skip if URL or very similar title already exists in queue or stories."""
    async with db.connection() as conn, conn.cursor() as cur:
        if source_url:
            await cur.execute(
                """
                SELECT 1 FROM content_queue
                WHERE source_url = %s
                LIMIT 1
                """,
                (source_url,),
            )
            if await cur.fetchone():
                return True

        await cur.execute(
            """
            SELECT 1 FROM stories
            WHERE lower(title) = lower(%s)
            LIMIT 1
            """,
            (title.strip(),),
        )
        return await cur.fetchone() is not None


async def find_related_entities(text: str) -> dict[str, list[str]]:
    """Match people and commissions mentioned in source text."""
    text_lower = text.lower()
    related: dict[str, list[str]] = {"people": [], "commissions": [], "siu": []}

    async with db.connection() as conn, conn.cursor() as cur:
        await cur.execute(
            """
            SELECT full_name FROM people
            WHERE length(full_name) >= 4
            ORDER BY length(full_name) DESC
            LIMIT 500
            """,
        )
        for (name,) in await cur.fetchall():
            if name and name.lower() in text_lower:
                related["people"].append(name)
                if len(related["people"]) >= 5:
                    break

        await cur.execute(
            """
            SELECT name FROM commissions
            ORDER BY length(name) DESC
            LIMIT 200
            """,
        )
        for (name,) in await cur.fetchall():
            if name and name.lower() in text_lower:
                related["commissions"].append(name)
                if len(related["commissions"]) >= 5:
                    break

    return related


async def calculate_relevance(text: str) -> float:
    """Heuristic relevance score against Record coverage areas."""
    text_lower = text.lower()
    score = 0.0

    for kw in HIGH_KEYWORDS:
        if kw in text_lower:
            score += 0.12

    related = await find_related_entities(text)
    score += min(len(related["people"]) * 0.08, 0.32)
    score += min(len(related["commissions"]) * 0.1, 0.3)

    if re.search(r"\bR\d{1,4}\s*[/\-]?\s*\d{4}\b", text, re.I):
        score += 0.15

    return min(score, 1.0)


async def add_to_content_queue(payload: dict[str, object]) -> str | None:
    """Insert a pending queue row; returns id or None if duplicate."""
    title = str(payload["title"]).strip()
    source = str(payload["source"])
    source_url = payload.get("source_url")
    relevance_score = float(payload.get("relevance_score", 0))
    summary = payload.get("summary")
    related_entities = payload.get("related_entities") or {}
    suggested_action = payload.get("suggested_action") or "new_story"

    if await is_already_tracked(title, str(source_url) if source_url else None):
        return None

    async with db.connection() as conn, conn.cursor() as cur:
        await cur.execute(
            """
            INSERT INTO content_queue (
              title, source, source_url, relevance_score,
              suggested_action, related_entities, summary, status
            )
            VALUES (%s, %s, %s, %s, %s, %s::jsonb, %s, 'pending')
            RETURNING id::text
            """,
            (
                title,
                source,
                source_url,
                relevance_score,
                suggested_action,
                json.dumps(related_entities),
                summary,
            ),
        )
        row = await cur.fetchone()
        await conn.commit()
        return row[0] if row else None
