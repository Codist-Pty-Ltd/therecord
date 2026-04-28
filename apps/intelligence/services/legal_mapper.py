"""Map alleged crimes to South African statutes and constitutional provisions.

Data lives in-module as a flat dictionary. This is intentionally simple and
auditable — every mapping is reviewable by a human. If this grows beyond a few
dozen crimes or needs per-province nuance, promote it to a database-backed
lookup in the NestJS API.
"""

from __future__ import annotations

from typing import TypedDict

from models.responses import LegalReference


class _LawEntry(TypedDict, total=False):
    act: str
    short: str
    act_number: str
    section: str
    relevance: str
    is_constitutional: bool


CRIME_TO_LAW: dict[str, list[_LawEntry]] = {
    "corruption": [
        {
            "act": "Prevention and Combating of Corrupt Activities Act",
            "short": "PRECCA",
            "act_number": "12 of 2004",
            "section": "3",
            "relevance": "General corruption offence — giving or receiving gratification.",
            "is_constitutional": False,
        },
        {
            "act": "Constitution of the Republic of South Africa, 1996",
            "short": "Constitution",
            "act_number": "108 of 1996",
            "section": "195",
            "relevance": "Public servants must be accountable and serve the public interest.",
            "is_constitutional": True,
        },
    ],
    "political interference": [
        {
            "act": "South African Police Service Act",
            "short": "SAPS Act",
            "act_number": "68 of 1995",
            "section": "207",
            "relevance": "The Minister may only give policy directions, not operational orders.",
            "is_constitutional": False,
        },
        {
            "act": "Constitution of the Republic of South Africa, 1996",
            "short": "Constitution",
            "act_number": "108 of 1996",
            "section": "205",
            "relevance": "The police service must act without fear, favour or prejudice.",
            "is_constitutional": True,
        },
    ],
    "fraud": [
        {
            "act": "Common Law",
            "short": "Common Law",
            "act_number": "",
            "section": "Fraud",
            "relevance": (
                "Unlawful and intentional misrepresentation causing actual or "
                "potential prejudice to another."
            ),
            "is_constitutional": False,
        },
        {
            "act": "Prevention of Organised Crime Act",
            "short": "POCA",
            "act_number": "121 of 1998",
            "section": "4",
            "relevance": "Money laundering offences — dealing with the proceeds of fraud.",
            "is_constitutional": False,
        },
    ],
    "murder": [
        {
            "act": "Common Law",
            "short": "Common Law",
            "act_number": "",
            "section": "Murder",
            "relevance": "Unlawful and intentional killing of another human being.",
            "is_constitutional": False,
        },
        {
            "act": "Criminal Law Amendment Act",
            "short": "Minimum Sentences Act",
            "act_number": "105 of 1997",
            "section": "51",
            "relevance": (
                "Mandatory minimum sentences — life imprisonment for premeditated murder "
                "unless substantial and compelling circumstances justify a lesser sentence."
            ),
            "is_constitutional": False,
        },
        {
            "act": "Constitution of the Republic of South Africa, 1996",
            "short": "Constitution",
            "act_number": "108 of 1996",
            "section": "11",
            "relevance": "Everyone has the right to life.",
            "is_constitutional": True,
        },
    ],
    "tender fraud": [
        {
            "act": "Prevention and Combating of Corrupt Activities Act",
            "short": "PRECCA",
            "act_number": "12 of 2004",
            "section": "13",
            "relevance": (
                "Offences in respect of corrupt activities relating to the procuring of "
                "tenders — accepting or offering gratification to influence a tender."
            ),
            "is_constitutional": False,
        },
        {
            "act": "Public Finance Management Act",
            "short": "PFMA",
            "act_number": "1 of 1999",
            "section": "86",
            "relevance": (
                "Financial misconduct and criminal liability of accounting officers "
                "and accounting authorities over public funds."
            ),
            "is_constitutional": False,
        },
        {
            "act": "Constitution of the Republic of South Africa, 1996",
            "short": "Constitution",
            "act_number": "108 of 1996",
            "section": "217",
            "relevance": (
                "Organs of state must procure goods and services in a manner that is "
                "fair, equitable, transparent, competitive and cost-effective."
            ),
            "is_constitutional": True,
        },
    ],
    "defeating justice": [
        {
            "act": "Common Law",
            "short": "Common Law",
            "act_number": "",
            "section": "Defeating or obstructing the course of justice",
            "relevance": (
                "Unlawful and intentional conduct aimed at defeating or obstructing "
                "the administration of justice."
            ),
            "is_constitutional": False,
        },
        {
            "act": "Constitution of the Republic of South Africa, 1996",
            "short": "Constitution",
            "act_number": "108 of 1996",
            "section": "165",
            "relevance": (
                "Judicial authority is vested in the courts; no person or organ of "
                "state may interfere with their functioning."
            ),
            "is_constitutional": True,
        },
    ],
    "organised crime": [
        {
            "act": "Prevention of Organised Crime Act",
            "short": "POCA",
            "act_number": "121 of 1998",
            "section": "2",
            "relevance": (
                "Racketeering offence — participating in the conduct of an enterprise "
                "through a pattern of racketeering activity."
            ),
            "is_constitutional": False,
        },
    ],
}

# Aliases — alternate phrasings we still want to map to a canonical key.
ALIASES: dict[str, str] = {
    "organized crime": "organised crime",
    "defeating the ends of justice": "defeating justice",
    "obstruction of justice": "defeating justice",
    "procurement fraud": "tender fraud",
    "bribery": "corruption",
}


def map_crimes(crimes: list[str]) -> list[LegalReference]:
    """Return a deduplicated list of `LegalReference` for the given crimes.

    Matching is case-insensitive and tolerant of partial strings: any
    `CRIME_TO_LAW` key contained in (or containing) the normalised crime name
    contributes its references. Exact alias matches go through `ALIASES`.
    """
    references: list[LegalReference] = []
    seen: set[tuple[str, str]] = set()

    for raw in crimes:
        normalised = raw.strip().lower()
        if not normalised:
            continue

        canonical = ALIASES.get(normalised, normalised)

        matched_keys: list[str] = []
        if canonical in CRIME_TO_LAW:
            matched_keys.append(canonical)
        else:
            for key in CRIME_TO_LAW:
                if key in canonical or canonical in key:
                    matched_keys.append(key)

        for key in matched_keys:
            for entry in CRIME_TO_LAW[key]:
                dedup_key = (entry["short"], entry["section"])
                if dedup_key in seen:
                    continue
                seen.add(dedup_key)
                references.append(
                    LegalReference(
                        act_name=entry["act"],
                        short_name=entry["short"],
                        section=entry["section"],
                        relevance=entry["relevance"],
                        is_constitutional=entry.get("is_constitutional", False),
                        act_number=entry.get("act_number") or None,
                    )
                )

    return references
