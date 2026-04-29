"""YouTube discovery — search, score, return candidates for human review (no auto-publish)."""

from __future__ import annotations

import logging
import os
import re
from datetime import UTC, datetime
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/youtube", tags=["youtube"])

# Credibility bonus when the channel ID is known-trusted news / Parliament.
TRUSTED_CHANNELS: dict[str, str] = {
    "UCvjBNumU6EvSKBjyMorRgqg": "Parliament of South Africa",
    "UCHMENjA6QZqLRMcJ2LCHPRA": "SABC News",
    "UCdrQ5GXQ4PEhJcpOBSe9UKw": "eNCA",
    "UCx4vmcA7GsOblXCBaP5VGEQ": "News24",
    "UC_ywBVoahJMVBJvHHOADKhQ": "Daily Maverick",
    "UCHHXpFGJmtFqDd1SdNjCvzg": "amaBhungane",
}


def _iso8601_duration_seconds(dur: str) -> int | None:
    """Parse PT#H#M#S to seconds."""
    if not dur or not dur.startswith("PT"):
        return None
    h = m = s = 0
    mo = re.search(r"(\d+)H", dur)
    if mo:
        h = int(mo.group(1))
    mo = re.search(r"(\d+)M", dur)
    if mo:
        m = int(mo.group(1))
    mo = re.search(r"(\d+)S", dur)
    if mo:
        s = int(mo.group(1))
    return h * 3600 + m * 60 + s


class DiscoverRequest(BaseModel):
    entity_type: str = Field(
        ...,
        pattern="^(commission|adhoc_committee|story|siu_proclamation)$",
    )
    entity_id: str
    entity_name: str
    search_queries: list[str]
    max_results_per_query: int = Field(default=10, ge=1, le=50)
    commission_key: str | None = None
    chair_name: str | None = None
    domain_keyword: str | None = None
    announced_year: str | None = None


class ScoredVideoOut(BaseModel):
    youtube_id: str
    title: str
    channel_name: str | None = None
    channel_id: str | None = None
    description: str | None = None
    published_at: str | None = None
    duration_seconds: int | None = None
    thumbnail_url: str | None = None
    view_count: int | None = None
    relevance_score: float
    relevance_reason: str | None = None


def _yt_get(url: str, params: dict[str, Any], api_key: str) -> dict[str, Any]:
    merged = {**params, "key": api_key}
    with httpx.Client(timeout=30.0) as client:
        r = client.get(url, params=merged)
        r.raise_for_status()
        return r.json()


def _search_videos(
    api_key: str,
    q: str,
    max_results: int,
) -> list[str]:
    data = _yt_get(
        "https://www.googleapis.com/youtube/v3/search",
        {
            "part": "snippet",
            "q": q,
            "type": "video",
            "relevanceLanguage": "en",
            "regionCode": "ZA",
            "maxResults": max_results,
        },
        api_key,
    )
    ids: list[str] = []
    for item in data.get("items") or []:
        vid = (item.get("id") or {}).get("videoId")
        if vid:
            ids.append(vid)
    return ids


def _videos_details(api_key: str, video_ids: list[str]) -> list[dict[str, Any]]:
    if not video_ids:
        return []
    out: list[dict[str, Any]] = []
    for i in range(0, len(video_ids), 50):
        chunk = video_ids[i : i + 50]
        data = _yt_get(
            "https://www.googleapis.com/youtube/v3/videos",
            {
                "part": "snippet,contentDetails,statistics",
                "id": ",".join(chunk),
            },
            api_key,
        )
        out.extend(data.get("items") or [])
    return out


def _channels_subscribers(api_key: str, channel_ids: list[str]) -> dict[str, int]:
    if not channel_ids:
        return {}
    unique = list(dict.fromkeys(channel_ids))
    subs: dict[str, int] = {}
    for i in range(0, len(unique), 50):
        chunk = unique[i : i + 50]
        data = _yt_get(
            "https://www.googleapis.com/youtube/v3/channels",
            {"part": "statistics", "id": ",".join(chunk)},
            api_key,
        )
        for ch in data.get("items") or []:
            cid = ch.get("id")
            sc = (ch.get("statistics") or {}).get("subscriberCount")
            if cid and sc is not None:
                try:
                    subs[cid] = int(sc)
                except ValueError:
                    subs[cid] = 0
    return subs


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", s.lower().strip())


def _score_video(
    *,
    title: str,
    description: str | None,
    channel_id: str | None,
    published_at: datetime | None,
    duration_sec: int | None,
    view_count: int | None,
    subs: dict[str, int],
    commission_key: str | None,
    chair_name: str | None,
    domain_keyword: str | None,
    announced_year: str | None,
) -> tuple[float, str]:
    t = _norm(title)
    parts: list[str] = []

    base = 0.3
    score = base

    ck = _norm(commission_key) if commission_key else ""
    if ck and ck in t:
        score += 0.3
        parts.append("exact entity phrase in title")
    elif ck:
        cwords = [w for w in re.split(r"[^\w]+", ck) if len(w) > 3]
        hit = sum(1 for w in cwords if w in t)
        if hit >= 2:
            score += 0.2
            parts.append("multiple entity tokens in title")

    ch = _norm(chair_name) if chair_name else ""
    if ch:
        chparts = [p for p in re.split(r"[^\w]+", ch) if len(p) > 2]
        if any(p in t for p in chparts):
            score += 0.2
            parts.append("chair name match")

    if domain_keyword:
        dk = _norm(domain_keyword)
        if dk and dk in t:
            score += 0.1
            parts.append("domain keyword in title")

    domain_hints = (
        "corruption",
        "commission",
        "inquiry",
        "hearing",
        "testimony",
        "police",
    )
    if any(h in t for h in domain_hints):
        score += 0.1
        parts.append("accountability keywords")

    if channel_id and channel_id in TRUSTED_CHANNELS:
        score += 0.2
        parts.append("trusted channel")
    elif channel_id:
        sc = subs.get(channel_id, 0)
        if sc > 100_000:
            score += 0.1
            parts.append("large channel")
        elif sc > 10_000:
            score += 0.05
            parts.append("mid-size channel")

    tl = t
    if any(w in tl for w in ("hearing", "testimony", "evidence")):
        score += 0.1
        parts.append("hearing/testimony framing")
    elif any(w in tl for w in ("documentary", " full", "full documentary")):
        score += 0.05
        parts.append("long-form hint")

    if published_at and announced_year and len(announced_year) >= 4:
        try:
            y0 = int(announced_year[:4])
            y1 = published_at.year
            if y0 <= y1 <= y0 + 1:
                score += 0.1
                parts.append("published near commission start")
            elif y0 <= y1 <= y0 + 2:
                score += 0.05
                parts.append("published within 2y of start")
        except ValueError:
            pass

    if any(
        w in tl
        for w in (
            "reaction",
            "rant",
            "exposed",
            "shocking",
        )
    ):
        score -= 0.1
        parts.append("clickbait penalty")

    if view_count is not None and view_count < 1000:
        score -= 0.05
        parts.append("low views")

    if duration_sec is not None and duration_sec < 60:
        score -= 0.1
        parts.append("very short video")

    score = max(0.0, min(1.0, round(score, 2)))
    reason = "; ".join(parts) if parts else "baseline"
    return score, reason


@router.post("/discover", response_model=list[ScoredVideoOut])
def youtube_discover(body: DiscoverRequest) -> list[ScoredVideoOut]:
    api_key = os.environ.get("YOUTUBE_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="YOUTUBE_API_KEY is not configured",
        )

    seen: set[str] = set()
    all_ids: list[str] = []
    for q in body.search_queries:
        q = q.strip()
        if not q:
            continue
        try:
            ids = _search_videos(api_key, q, body.max_results_per_query)
        except httpx.HTTPStatusError as e:
            logger.warning("YouTube search failed for %r: %s", q, e)
            continue
        for vid in ids:
            if vid not in seen:
                seen.add(vid)
                all_ids.append(vid)

    items = _videos_details(api_key, all_ids)
    channel_ids: list[str] = []
    for it in items:
        sn = it.get("snippet") or {}
        cid = sn.get("channelId")
        if cid:
            channel_ids.append(cid)
    subs = _channels_subscribers(api_key, channel_ids)

    out: list[ScoredVideoOut] = []
    for it in items:
        sn = it.get("snippet") or {}
        cd = it.get("contentDetails") or {}
        st = it.get("statistics") or {}
        vid = it.get("id")
        if not vid:
            continue
        title = sn.get("title") or ""
        channel_id = sn.get("channelId")
        channel_title = sn.get("channelTitle")
        desc_full = sn.get("description") or ""
        desc = desc_full[:500] if desc_full else None
        thumbs = sn.get("thumbnails") or {}
        thumb = thumbs.get("medium") or thumbs.get("default")
        thumb_url = (thumb or {}).get("url")
        published_raw = sn.get("publishedAt")
        published_at: datetime | None = None
        if published_raw:
            try:
                published_at = datetime.fromisoformat(
                    published_raw.replace("Z", "+00:00"),
                ).astimezone(UTC)
            except ValueError:
                published_at = None
        duration_sec = _iso8601_duration_seconds(cd.get("duration") or "")
        vc_raw = st.get("viewCount")
        view_count: int | None = None
        if vc_raw is not None:
            try:
                view_count = int(vc_raw)
            except ValueError:
                view_count = None

        score, reason = _score_video(
            title=title,
            description=desc,
            channel_id=channel_id,
            published_at=published_at,
            duration_sec=duration_sec,
            view_count=view_count,
            subs=subs,
            commission_key=body.entity_name or body.commission_key,
            chair_name=body.chair_name,
            domain_keyword=body.domain_keyword,
            announced_year=body.announced_year,
        )

        if score < 0.4:
            continue

        out.append(
            ScoredVideoOut(
                youtube_id=vid,
                title=title[:500],
                channel_name=channel_title,
                channel_id=channel_id,
                description=desc,
                published_at=published_raw,
                duration_seconds=duration_sec,
                thumbnail_url=thumb_url,
                view_count=view_count,
                relevance_score=score,
                relevance_reason=reason,
            )
        )

    out.sort(key=lambda x: x.relevance_score, reverse=True)
    return out
