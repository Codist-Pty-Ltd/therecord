"""Anthropic Claude client for plain-English summarisation."""

from __future__ import annotations

import logging
import os
from typing import Literal

from anthropic import AsyncAnthropic

from models.responses import SimplifyResponse

logger = logging.getLogger(__name__)

MODEL = "claude-sonnet-4-20250514"

ReadingLevel = Literal["child", "layperson", "legal"]

SYSTEM_PROMPTS: dict[ReadingLevel, str] = {
    "child": (
        "You explain South African legal and political events to a 10-year-old child. "
        "Use short sentences. Use analogies from school life. No jargon. "
        "Always explain what the law says in terms of fairness and rules."
    ),
    "layperson": (
        "You explain South African law to an ordinary citizen with no legal background. "
        "Be clear and direct. Define any legal terms you use. Be under 100 words."
    ),
    "legal": (
        "You are a South African legal analyst. Be precise. "
        "Cite the relevant Act and section."
    ),
}

MAX_TOKENS: dict[ReadingLevel, int] = {
    "child": 400,
    "layperson": 300,
    "legal": 700,
}

_client: AsyncAnthropic | None = None


def get_client() -> AsyncAnthropic:
    """Lazily construct the async Anthropic client from ANTHROPIC_API_KEY."""
    global _client
    if _client is None:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError(
                "ANTHROPIC_API_KEY is not set. The intelligence service needs it "
                "to call Claude. Put it in .env or export it in the container."
            )
        _client = AsyncAnthropic(api_key=api_key)
    return _client


async def simplify_text(text: str, level: ReadingLevel) -> SimplifyResponse:
    """Send `text` to Claude with the system prompt for the given reading level."""
    if level not in SYSTEM_PROMPTS:
        raise ValueError(
            f"Unknown reading level: {level!r}. Must be one of: child, layperson, legal."
        )

    client = get_client()
    logger.info("Claude simplify: level=%s, input_chars=%d", level, len(text))

    response = await client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS[level],
        system=SYSTEM_PROMPTS[level],
        messages=[{"role": "user", "content": text}],
    )

    # Claude returns a list of content blocks. Concatenate text blocks only;
    # ignore anything else (tool use, etc.) — not expected for this endpoint.
    parts: list[str] = []
    for block in response.content:
        block_text = getattr(block, "text", None)
        if isinstance(block_text, str):
            parts.append(block_text)
    simplified = "".join(parts).strip()

    return SimplifyResponse(simplified=simplified, reading_level=level)
