"""SIU media release monitoring agent."""

from __future__ import annotations

import logging

import httpx
from bs4 import BeautifulSoup

from agents.relevance import (
    MIN_RELEVANCE,
    add_to_content_queue,
    calculate_relevance,
    find_related_entities,
    is_already_tracked,
)

logger = logging.getLogger(__name__)

USER_AGENT = "TheRecord/1.0 (+https://therecord.co.za; accountability journalism)"
SIU_RELEASES_URL = "https://www.siu.org.za/media-releases/"


async def run_siu_agent() -> dict[str, int]:
    """Scrape SIU media releases and enqueue relevant items."""
    added = 0
    scanned = 0

    async with httpx.AsyncClient(timeout=30, headers={"User-Agent": USER_AGENT}) as client:
        response = await client.get(SIU_RELEASES_URL)
        response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    releases = soup.select("article") or soup.select(".media-release") or soup.select("h2 a")

    for release in releases[:40]:
        title_el = release.find(["h2", "h3", "a"]) if release.name != "a" else release
        link_el = release.find("a", href=True) if release.name != "a" else release

        if not title_el:
            continue

        title_text = title_el.get_text(strip=True)
        if len(title_text) < 8:
            continue

        link = link_el["href"] if link_el and link_el.get("href") else None
        if link and not str(link).startswith("http"):
            link = f"https://www.siu.org.za{link}"

        scanned += 1
        if await is_already_tracked(title_text, link):
            continue

        relevance = await calculate_relevance(title_text)
        if relevance < MIN_RELEVANCE:
            continue

        row_id = await add_to_content_queue(
            {
                "title": title_text,
                "source": "SIU",
                "source_url": link,
                "relevance_score": relevance,
                "suggested_action": "new_story",
                "related_entities": await find_related_entities(title_text),
                "summary": title_text,
            },
        )
        if row_id:
            added += 1

    logger.info("SIU agent scanned=%s added=%s", scanned, added)
    return {"scanned": scanned, "added": added}
