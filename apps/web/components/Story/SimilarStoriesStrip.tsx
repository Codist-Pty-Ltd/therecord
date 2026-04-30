"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

import { formatRands } from "@/lib/format";
import { storyCategoryLabel } from "@/lib/story-category-labels";
import type { SimilarityReason, SimilarStoryBrief } from "@the-record/shared-types";

function reasonLine(
  reason: SimilarityReason | undefined,
  matchType: SimilarStoryBrief["match_type"],
): string {
  if (reason) {
    const map: Record<SimilarityReason, string> = {
      same_province: "Same province",
      same_municipality: "Same municipality",
      same_sector: "Same sector focus",
      same_accused: "Overlapping accused",
      same_category: "Same story category",
      same_pattern: "Same accountability pattern",
    };
    return map[reason] ?? reason;
  }
  switch (matchType) {
    case "fallback_province":
      return "Also tracked in this province";
    case "fallback_category":
      return "Same category thread";
    case "explicit_table":
      return "Editorial link";
    default:
      return "Related coverage";
  }
}

const EASE = [0.22, 1, 0.36, 1] as const;

interface SimilarStoriesStripProps {
  stories: SimilarStoryBrief[];
  currentSlug: string;
}

export default function SimilarStoriesStrip({
  stories,
  currentSlug,
}: SimilarStoriesStripProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const filtered = stories.filter((s) => s.slug !== currentSlug);

  if (filtered.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Related stories"
      className="mt-12 md:mt-14 border-t border-charcoal/10 pt-10 md:pt-12"
    >
      <h2 className="label-smallcaps text-charcoal/55 mb-5">Related stories</h2>

      <div className="-mx-4 md:mx-0">
        <ul className="flex gap-3 overflow-x-auto px-4 pb-2 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 snap-x snap-mandatory md:snap-none">
          {filtered.map((s, i) => (
            <motion.li
              key={s.slug}
              className="snap-start shrink-0 w-[min(280px,82vw)] md:w-auto"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, ease: EASE, delay: i * 0.04 }}
            >
              <Link
                href={`/story/${s.slug}`}
                className="flex h-full flex-col rounded-2xl border border-charcoal/10 bg-cream/90 p-4 transition hover:border-amber/35 hover:bg-amber/[0.04]"
              >
                <div className="flex flex-wrap gap-1.5">
                  {s.province_abbreviation || s.province_name ? (
                    <span className="rounded border border-amber/40 bg-amber/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-amber">
                      {s.province_abbreviation ?? s.province_name}
                    </span>
                  ) : null}
                  {s.story_category ? (
                    <span className="rounded border border-charcoal/12 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-charcoal/65">
                      {storyCategoryLabel(s.story_category)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 font-serif text-sm leading-snug text-charcoal line-clamp-3">
                  {s.title}
                </p>
                {s.total_amount_rands ? (
                  <p className="mt-1 font-mono text-xs text-charcoal/45 tabular-nums">
                    {formatRands(s.total_amount_rands)}
                  </p>
                ) : null}
                <p className="mt-auto pt-3 text-[11px] italic text-charcoal/45 leading-relaxed">
                  {reasonLine(s.similarity_reason, s.match_type)}
                  {s.similarity_note ? ` — ${s.similarity_note}` : ""}
                </p>
              </Link>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
