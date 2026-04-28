"""Legal mapping endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from models.requests import LegalMapRequest
from models.responses import LegalMapResponse
from services.legal_mapper import map_crimes

router = APIRouter(prefix="/legal", tags=["legal"])


@router.post(
    "/map",
    response_model=LegalMapResponse,
    summary="Map alleged crimes to SA statutes and constitutional provisions",
    description=(
        "Given a list of human-readable crime names (e.g. 'corruption', 'tender fraud'), "
        "returns the applicable South African Acts and constitutional sections."
    ),
)
async def map_legal(payload: LegalMapRequest) -> LegalMapResponse:
    references = map_crimes(payload.crimes_alleged)
    return LegalMapResponse(references=references)
