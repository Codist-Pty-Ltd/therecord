"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

import { agAuditChipClass, agAuditLabel } from "@/lib/ag-audit-ui";
import { formatRands } from "@/lib/format";
import { storyCategoryLabel } from "@/lib/story-category-labels";
import type { ProvinceListItem } from "@the-record/shared-types";

const EASE = [0.22, 1, 0.36, 1] as const;

function formatCwPct(raw: string | null): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (!t) return null;
  return t.endsWith("%") ? t : `${t}%`;
}

export default function ProvinceIndexCards({ provinces }: { provinces: ProvinceListItem[] }) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <ul className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-x-8 md:gap-y-2">
      {provinces.map((p, i) => (
        <motion.li
          key={p.slug}
          className="border-b border-charcoal/12 md:border-0 pb-8 md:pb-10 last:border-b-0 last:pb-0"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-20px" }}
          transition={{ duration: 0.4, ease: EASE, delay: Math.min(i * 0.05, 0.35) }}
        >
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="font-serif text-[20px] leading-tight text-charcoal">
                {p.name}
              </h2>
              {p.abbreviation ? (
                <span className="rounded border border-amber/35 bg-amber/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-amber">
                  {p.abbreviation}
                </span>
              ) : null}
            </div>

            <p className="font-mono text-xs text-charcoal/65 tabular-nums">
              <span className="text-charcoal">{p.stories_count}</span> stories ·{" "}
              <span className="text-charcoal">{formatRands(p.total_expenditure_rands)}</span>{" "}
              tracked
              {formatCwPct(p.corruption_watch_complaint_percentage) ? (
                <>
                  {" "}
                  ·{" "}
                  <span className="text-charcoal">
                    {formatCwPct(p.corruption_watch_complaint_percentage)}
                  </span>{" "}
                  CW complaints
                </>
              ) : null}
            </p>

            {p.worst_municipality_ag_outcome ? (
              <span
                className={`inline-flex w-max rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${agAuditChipClass(p.worst_municipality_ag_outcome)}`}
              >
                {agAuditLabel(p.worst_municipality_ag_outcome)} (worst muni)
              </span>
            ) : (
              <span className="font-mono text-[10px] text-charcoal/40">
                No municipality AG outcome on file
              </span>
            )}

            {p.featured_story ? (
              <div className="rounded-xl border border-charcoal/10 bg-cream/60 px-3 py-2.5">
                <p className="font-serif text-sm text-charcoal line-clamp-2">
                  {p.featured_story.title}
                </p>
                {p.featured_story.story_category ? (
                  <span className="mt-1 inline-flex rounded border border-charcoal/12 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-charcoal/60">
                    {storyCategoryLabel(p.featured_story.story_category)}
                  </span>
                ) : null}
              </div>
            ) : null}

            <Link
              href={`/provinces/${p.slug}`}
              className="font-mono text-xs text-amber hover:underline"
            >
              Explore province →
            </Link>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}
