"""Bootstrap human_label values for Phase 2 relevance training."""

from __future__ import annotations

import argparse
import asyncio
import logging

import db

logger = logging.getLogger(__name__)

# Seed rows when the table is empty (bootstrap until real reviewers label YouTube discoveries).
BOOTSTRAP_ROWS: list[tuple[str, str, str | None, str, float, float, bool]] = [
    (
        "bootstrap-zondo-hearing",
        "Zondo Commission state capture hearing testimony",
        "SABC News",
        "Zondo Commission state capture hearing testimony\nSABC News\nJudicial commission evidence on procurement fraud.",
        0.82,
        0.75,
        True,
    ),
    (
        "bootstrap-madlanga",
        "Madlanga Commission SAPS corruption inquiry",
        "eNCA",
        "Madlanga Commission SAPS corruption inquiry\neNCA\nPolice corruption and procurement evidence.",
        0.79,
        0.71,
        True,
    ),
    (
        "bootstrap-siu-eskom",
        "SIU Eskom investigation proclamation procurement",
        "News24",
        "SIU Eskom investigation proclamation procurement\nNews24\nSpecial Investigating Unit scope on state entity contracts.",
        0.76,
        0.68,
        True,
    ),
    (
        "bootstrap-tembisa",
        "Tembisa Hospital R2bn corruption SIU proclamation",
        "Daily Maverick",
        "Tembisa Hospital R2bn corruption SIU proclamation\nDaily Maverick\nGauteng health procurement and SIU referral.",
        0.74,
        0.66,
        True,
    ),
    (
        "bootstrap-pasta",
        "Best pasta recipes for dinner",
        "Food Channel",
        "Best pasta recipes for dinner\nFood Channel\nQuick Italian cooking tutorial.",
        0.12,
        0.15,
        False,
    ),
    (
        "bootstrap-gaming",
        "Fortnite season update gameplay highlights",
        "GamerX",
        "Fortnite season update gameplay highlights\nGamerX\nBattle royale stream recap.",
        0.08,
        0.11,
        False,
    ),
    (
        "bootstrap-football",
        "Premier League football transfer rumours",
        "SportsTube",
        "Premier League football transfer rumours\nSportsTube\nWeekly soccer news roundup.",
        0.14,
        0.18,
        False,
    ),
    (
        "bootstrap-makeup",
        "Makeup tutorial everyday look 2026",
        "BeautyVlog",
        "Makeup tutorial everyday look 2026\nBeautyVlog\nCosmetics and skincare routine.",
        0.09,
        0.10,
        False,
    ),
]


async def _labelled_count() -> int:
    rows = await db.fetch(
        "SELECT COUNT(*) FROM relevance_label WHERE human_label IS NOT NULL",
    )
    return int(rows[0][0]) if rows else 0


async def _total_count() -> int:
    rows = await db.fetch("SELECT COUNT(*) FROM relevance_label")
    return int(rows[0][0]) if rows else 0


async def _bootstrap_empty_table() -> int:
    inserted = 0
    for row in BOOTSTRAP_ROWS:
        await db.execute(
            """
            INSERT INTO relevance_label (
                video_id, title, channel, text, score, method,
                heuristic_score, human_label
            )
            VALUES (%s, %s, %s, %s, %s, 'centroid_v1', %s, %s)
            ON CONFLICT (video_id)
            DO UPDATE SET human_label = EXCLUDED.human_label
            """,
            row,
        )
        inserted += 1
    return inserted


async def _pseudo_label_unlabelled(threshold: float) -> int:
    rows = await db.fetch(
        """
        UPDATE relevance_label
        SET human_label = (score >= %s)
        WHERE human_label IS NULL
        RETURNING video_id
        """,
        (threshold,),
    )
    return len(rows)


async def run_bootstrap(*, threshold: float, force_seed: bool) -> None:
    await db.open_pool()
    try:
        labelled = await _labelled_count()
        total = await _total_count()
        logger.info("relevance_label: total=%s labelled=%s", total, labelled)

        if total == 0 or force_seed:
            count = await _bootstrap_empty_table()
            logger.info("Inserted/updated %s bootstrap relevance_label rows", count)
            labelled = await _labelled_count()

        updated = await _pseudo_label_unlabelled(threshold)
        if updated:
            logger.info("Pseudo-labelled %s unlabelled rows at threshold=%.2f", updated, threshold)

        labelled = await _labelled_count()
        logger.info("Done: %s labelled rows available for training", labelled)
        if labelled < 4:
            raise RuntimeError(
                f"Need at least 4 labelled rows for training, found {labelled}",
            )
    finally:
        await db.close_pool()


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    parser = argparse.ArgumentParser(description="Bootstrap relevance_label human_label values")
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.45,
        help="Score threshold for pseudo-labelling unlabelled rows",
    )
    parser.add_argument(
        "--force-seed",
        action="store_true",
        help="Insert bootstrap rows even when the table is not empty",
    )
    args = parser.parse_args()
    asyncio.run(run_bootstrap(threshold=args.threshold, force_seed=args.force_seed))


if __name__ == "__main__":
    main()
