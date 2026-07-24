"""Operator-triggered content monitoring agents."""

from __future__ import annotations

from fastapi import APIRouter

from agents.saflii_agent import run_saflii_agent
from agents.siu_agent import run_siu_agent

router = APIRouter(prefix="/agents", tags=["agents"])


@router.post("/siu/run")
async def run_siu() -> dict[str, int]:
    return await run_siu_agent()


@router.post("/saflii/run")
async def run_saflii() -> dict[str, int]:
    return await run_saflii_agent()
