"""SAFLII RSS monitoring agent for new court judgments."""

from __future__ import annotations

import logging
import xml.etree.ElementTree as ET

import httpx

from agents.relevance import (
    MIN_RELEVANCE,
    add_to_content_queue,
    calculate_relevance,
    find_related_entities,
    is_already_tracked,
)

logger = logging.getLogger(__name__)

USER_AGENT = "TheRecord/1.0 (+https://therecord.co.za; accountability journalism)"

FEEDS = (
    "https://www.saflii.org/cgi-bin/feed.pl?court=za/cases/ZASCA",
    "https://www.saflii.org/cgi-bin/feed.pl?court=za/cases/ZACC",
    "https://www.saflii.org/cgi-bin/feed.pl?court=za/cases/ZAGPPHC",
)


async def run_saflii_agent() -> dict[str, int]:
    """Poll SAFLII RSS feeds and enqueue relevant judgments."""
    added = 0
    scanned = 0

    async with httpx.AsyncClient(timeout=30, headers={"User-Agent": USER_AGENT}) as client:
        for feed_url in FEEDS:
            try:
                response = await client.get(feed_url)
                response.raise_for_status()
                root = ET.fromstring(response.text)

                for item in root.findall(".//item"):
                    title = (item.findtext("title") or "").strip()
                    link = (item.findtext("link") or "").strip()
                    description = (item.findtext("description") or "").strip()

                    if not title or not link:
                        continue

                    scanned += 1
                    if await is_already_tracked(title, link):
                        continue

                    blob = f"{title} {description}"
                    relevance = await calculate_relevance(blob)
                    if relevance < MIN_RELEVANCE:
                        continue

                    row_id = await add_to_content_queue(
                        {
                            "title": title,
                            "source": "SAFLII",
                            "source_url": link,
                            "relevance_score": relevance,
                            "suggested_action": "new_story",
                            "related_entities": await find_related_entities(blob),
                            "summary": description[:500] if description else title,
                        },
                    )
                    if row_id:
                        added += 1
            except Exception as exc:  # noqa: BLE001 — one feed must not block others
                logger.warning("SAFLII agent error for %s: %s", feed_url, exc)

    logger.info("SAFLII agent scanned=%s added=%s", scanned, added)
    return {"scanned": scanned, "added": added}
