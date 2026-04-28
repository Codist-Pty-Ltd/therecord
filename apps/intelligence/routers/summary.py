"""Plain-English summarisation endpoints."""

from __future__ import annotations

import logging

from anthropic import APIError, APIStatusError, AuthenticationError, RateLimitError
from fastapi import APIRouter, HTTPException, status

from models.requests import SimplifyRequest
from models.responses import SimplifyResponse
from services.claude_service import simplify_text

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/summary", tags=["summary"])


@router.post(
    "/simplify",
    response_model=SimplifyResponse,
    summary="Simplify text via Claude",
    description=(
        "Rewrites the given text at one of three reading levels: child (≈10yo), "
        "layperson (no legal background), or legal (analyst-grade)."
    ),
)
async def simplify(payload: SimplifyRequest) -> SimplifyResponse:
    try:
        return await simplify_text(payload.text, payload.level)
    except RuntimeError as exc:
        logger.exception("Claude client misconfigured")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except AuthenticationError as exc:
        logger.exception("Anthropic authentication failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Anthropic authentication failed — check ANTHROPIC_API_KEY.",
        ) from exc
    except RateLimitError as exc:
        logger.warning("Anthropic rate limited")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Anthropic rate limit exceeded. Try again shortly.",
        ) from exc
    except APIStatusError as exc:
        logger.exception("Anthropic API status error")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Anthropic API returned {exc.status_code}.",
        ) from exc
    except APIError as exc:
        logger.exception("Anthropic API error")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Upstream Anthropic API error.",
        ) from exc
