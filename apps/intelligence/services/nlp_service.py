"""spaCy-backed NLP: entity extraction and story clustering."""

from __future__ import annotations

import logging
from difflib import SequenceMatcher
from functools import lru_cache
from typing import Any, TYPE_CHECKING

import spacy

from models.responses import (
    ClusterResponse,
    EventEntity,
    ExtractEntitiesResponse,
    OrganisationEntity,
    PersonEntity,
)

if TYPE_CHECKING:  # pragma: no cover — only for static type checkers
    from spacy.language import Language

logger = logging.getLogger(__name__)

SPACY_MODEL = "en_core_web_sm"

# Threshold below which the cluster endpoint decides the incoming article is a
# new story rather than an update to an existing one.
CLUSTER_CONFIDENCE_THRESHOLD = 0.6

# Keyword fallback for crime detection — complements spaCy NER, which doesn't
# label offences as a specific entity type. Ordered / deduplicated in output.
CRIME_KEYWORDS: frozenset[str] = frozenset(
    {
        "corruption",
        "bribery",
        "fraud",
        "tender fraud",
        "theft",
        "murder",
        "assault",
        "rape",
        "robbery",
        "hijacking",
        "kidnapping",
        "racketeering",
        "money laundering",
        "extortion",
        "perjury",
        "political interference",
        "defeating justice",
        "defeating the ends of justice",
        "organised crime",
        "organized crime",
        "terrorism",
    }
)


@lru_cache(maxsize=1)
def get_nlp() -> "Language":
    """Load (and cache) the spaCy pipeline. Safe to call from any thread."""
    logger.info("Loading spaCy model '%s'…", SPACY_MODEL)
    try:
        nlp = spacy.load(SPACY_MODEL)
    except OSError as exc:
        raise RuntimeError(
            f"spaCy model '{SPACY_MODEL}' is not installed. "
            f"Install it with: python -m spacy download {SPACY_MODEL}"
        ) from exc
    logger.info("spaCy model '%s' loaded.", SPACY_MODEL)
    return nlp


# --------------------------------------------------------------------- extract


async def extract_entities(text: str) -> ExtractEntitiesResponse:
    """Run spaCy NER over `text` and return structured entities."""
    nlp = get_nlp()
    doc = nlp(text)

    people: list[PersonEntity] = []
    organisations: list[OrganisationEntity] = []
    events: list[EventEntity] = []
    locations: list[str] = []

    seen_people: set[str] = set()
    seen_orgs: set[str] = set()
    seen_locations: set[str] = set()

    for ent in doc.ents:
        name = ent.text.strip()
        if not name:
            continue
        key = name.lower()

        if ent.label_ == "PERSON":
            if key not in seen_people:
                seen_people.add(key)
                people.append(
                    PersonEntity(
                        name=name,
                        role=None,
                        confidence=0.8,  # spaCy NER has no per-entity score; proxy
                    )
                )
        elif ent.label_ == "ORG":
            if key not in seen_orgs:
                seen_orgs.add(key)
                organisations.append(OrganisationEntity(name=name, type=None))
        elif ent.label_ == "GPE":
            if key not in seen_locations:
                seen_locations.add(key)
                locations.append(name)
        elif ent.label_ == "EVENT":
            events.append(
                EventEntity(
                    type="event",
                    date_mentioned=None,
                    description=name,
                )
            )
        elif ent.label_ == "DATE":
            sentence = ent.sent.text.strip() if ent.sent is not None else name
            events.append(
                EventEntity(
                    type="date_reference",
                    date_mentioned=name,
                    description=sentence,
                )
            )

    lowered = text.lower()
    crimes_alleged = sorted({kw for kw in CRIME_KEYWORDS if kw in lowered})

    return ExtractEntitiesResponse(
        people=people,
        organisations=organisations,
        events=events,
        crimes_alleged=crimes_alleged,
        locations=sorted(locations),
    )


# --------------------------------------------------------------------- cluster


async def cluster_match(
    headline: str,
    text: str,
    story_candidates: list[dict[str, Any]],
) -> ClusterResponse:
    """Find the best matching candidate story for an incoming article.

    Scoring is a weighted mix of:
      - Jaccard overlap on lemmatised non-stopword tokens (70%), and
      - SequenceMatcher ratio on headlines (30%).

    Returns `matched_story_id=None` when the best score is below
    `CLUSTER_CONFIDENCE_THRESHOLD`.
    """
    if not story_candidates:
        return ClusterResponse(
            matched_story_id=None,
            confidence=0.0,
            reasoning="No candidate stories provided.",
        )

    nlp = get_nlp()
    incoming_tokens = _token_set(nlp, f"{headline} {text}")
    incoming_headline = headline.strip().lower()

    best_id: str | None = None
    best_score = 0.0
    best_reason = ""

    for candidate in story_candidates:
        cid = candidate.get("id")
        if cid is None:
            continue

        candidate_text_parts = [
            str(candidate.get("title", "")),
            str(candidate.get("summary", "")),
            str(candidate.get("plain_english_summary", "")),
        ]
        keywords = candidate.get("keywords") or []
        if isinstance(keywords, list):
            candidate_text_parts.append(" ".join(str(k) for k in keywords))
        candidate_blob = " ".join(candidate_text_parts)

        candidate_tokens = _token_set(nlp, candidate_blob)
        jaccard = _jaccard(incoming_tokens, candidate_tokens)

        candidate_title = str(candidate.get("title", "")).strip().lower()
        headline_ratio = (
            SequenceMatcher(a=incoming_headline, b=candidate_title).ratio()
            if candidate_title
            else 0.0
        )

        combined = 0.7 * jaccard + 0.3 * headline_ratio
        if combined > best_score:
            overlap = sorted(incoming_tokens & candidate_tokens)
            best_score = combined
            best_id = str(cid)
            shared = ", ".join(overlap[:10]) if overlap else "(none)"
            best_reason = (
                f"Jaccard={jaccard:.2f}, headline_ratio={headline_ratio:.2f}, "
                f"combined={combined:.2f}. Shared terms: {shared}"
            )

    if best_score < CLUSTER_CONFIDENCE_THRESHOLD:
        return ClusterResponse(
            matched_story_id=None,
            confidence=round(best_score, 3),
            reasoning=(
                f"Best candidate scored {best_score:.3f}, below threshold "
                f"{CLUSTER_CONFIDENCE_THRESHOLD}. Likely a new story."
            ),
        )

    return ClusterResponse(
        matched_story_id=best_id,
        confidence=round(best_score, 3),
        reasoning=best_reason,
    )


# ---------------------------------------------------------------- similarity


def _token_set(nlp: "Language", text: str) -> set[str]:
    """Lemmatised, lower-cased, stopword-free, length-filtered token set."""
    if not text.strip():
        return set()
    doc = nlp(text.lower())
    return {
        token.lemma_
        for token in doc
        if not token.is_stop
        and not token.is_punct
        and not token.is_space
        and len(token.lemma_) > 2
    }


def _jaccard(a: set[str], b: set[str]) -> float:
    if not a and not b:
        return 0.0
    union = a | b
    if not union:
        return 0.0
    return len(a & b) / len(union)
