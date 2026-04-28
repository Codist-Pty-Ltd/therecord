"use client";

/**
 * Editorial list of laws, grouped by category, with each row expandable to
 * reveal its sections inline. The brief explicitly asked for rows (not
 * cards) so the visual language matches the rest of the platform's
 * accountability surfaces.
 *
 * Client Component — owns the per-row expanded state and the keyboard
 * affordances (Enter / Space toggle, ArrowRight expand, ArrowLeft collapse).
 * The data itself is server-rendered and passed in as props, so SSR /
 * crawlers still see every law name + every section title without JS.
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useCallback, useState } from "react";

import {
  categoryChipClasses,
  extractActYear,
  groupLawsByCategory,
  LAW_CATEGORY_LABELS,
  pluraliseSections,
} from "@/lib/laws";
import type { LawSummary, LawSection } from "@the-record/shared-types";

interface LawWithSections extends LawSummary {
  /** Always present (may be `[]`) — the API always inlines sections on this list. */
  sections: LawSection[];
}

interface LawListProps {
  laws: LawWithSections[];
}

export default function LawList({ laws }: LawListProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const toggle = useCallback((lawId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(lawId)) next.delete(lawId);
      else next.add(lawId);
      return next;
    });
  }, []);

  if (laws.length === 0) {
    return <EmptyState />;
  }

  const grouped = groupLawsByCategory(laws);

  return (
    <ul className="divide-y divide-charcoal/10 border-y border-charcoal/10">
      {grouped.map((group) => (
        <li key={group.category} className="py-2">
          <h2 className="label-smallcaps text-charcoal/55 px-4 md:px-8 py-3 md:py-4">
            {LAW_CATEGORY_LABELS[group.category]}
          </h2>
          <ul className="divide-y divide-charcoal/10 border-t border-charcoal/10">
            {group.laws.map((law) => (
              <LawRow
                key={law.id}
                law={law}
                isExpanded={expanded.has(law.id)}
                onToggle={() => toggle(law.id)}
              />
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

// -----------------------------------------------------------------------------
// Row
// -----------------------------------------------------------------------------

interface LawRowProps {
  law: LawWithSections;
  isExpanded: boolean;
  onToggle: () => void;
}

function LawRow({ law, isExpanded, onToggle }: LawRowProps) {
  const reduceMotion = useReducedMotion();
  const chip = categoryChipClasses(law.category);
  const sectionCount = law.sections.length;
  const actYear = extractActYear(law.act_number);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowRight" && !isExpanded) {
      event.preventDefault();
      onToggle();
    } else if (event.key === "ArrowLeft" && isExpanded) {
      event.preventDefault();
      onToggle();
    }
  };

  return (
    <li className="px-4 md:px-8 py-5 md:py-7 transition-colors hover:bg-charcoal/[0.025]">
      <div className="flex flex-col gap-3 md:gap-4">
        {/* Top row: short-name chip + expand button */}
        <button
          type="button"
          onClick={onToggle}
          onKeyDown={handleKeyDown}
          aria-expanded={isExpanded}
          aria-controls={`law-sections-${law.id}`}
          className="group flex items-start justify-between gap-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cream rounded-md"
        >
          <div className="flex flex-col gap-2 md:gap-2.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-amber text-[11px] md:text-xs uppercase tracking-[0.16em] border border-amber/30 bg-amber/8 rounded-full px-2.5 py-1">
                {law.short_name}
              </span>
              <span
                className={`font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] border ${chip.bg} ${chip.text} ${chip.border} rounded-full px-2.5 py-1`}
              >
                {LAW_CATEGORY_LABELS[law.category]}
              </span>
              <span className="font-mono text-charcoal/45 text-[11px] md:text-xs">
                Act {law.act_number}
                {actYear ? null : null /* year is already inside act_number */}
              </span>
            </div>

            <h3 className="font-serif text-[18px] md:text-[22px] leading-snug text-charcoal group-hover:text-amber transition-colors">
              {law.name}
            </h3>

            <p className="font-sans text-[15px] md:text-base text-charcoal/70 leading-relaxed">
              {law.plain_english}
            </p>
          </div>

          <ExpandChevron isExpanded={isExpanded} />
        </button>

        {/* Bottom meta row: section counter + full-text link */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] md:text-[13px]">
          <span className="font-mono text-charcoal/55">
            {pluraliseSections(sectionCount)}
          </span>

          {law.full_text_url ? (
            <a
              href={law.full_text_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.14em] text-[10px] md:text-[11px] text-legal-blue hover:text-amber transition-colors"
            >
              Full text
              <span aria-hidden>↗</span>
            </a>
          ) : null}
        </div>

        {/* Inline section list */}
        <AnimatePresence initial={false}>
          {isExpanded ? (
            <motion.div
              id={`law-sections-${law.id}`}
              key="sections"
              initial={
                reduceMotion ? { opacity: 1 } : { opacity: 0, height: 0 }
              }
              animate={
                reduceMotion ? { opacity: 1 } : { opacity: 1, height: "auto" }
              }
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
              transition={{
                duration: reduceMotion ? 0 : 0.28,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="overflow-hidden"
            >
              <SectionsList law={law} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </li>
  );
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

function ExpandChevron({ isExpanded }: { isExpanded: boolean }) {
  return (
    <span
      aria-hidden
      className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full border border-charcoal/15 text-charcoal/55 group-hover:border-amber group-hover:text-amber transition-colors"
    >
      <motion.svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        animate={{ rotate: isExpanded ? 180 : 0 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        aria-hidden
      >
        <path
          d="M3 5l4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.svg>
    </span>
  );
}

function SectionsList({ law }: { law: LawWithSections }) {
  if (law.sections.length === 0) {
    return (
      <div className="mt-3 ml-0 md:ml-2 pl-4 border-l-2 border-charcoal/10">
        <p className="font-sans text-[14px] text-charcoal/55 italic py-3">
          No sections published yet for this Act.
        </p>
      </div>
    );
  }

  return (
    <ol className="mt-3 ml-0 md:ml-2 pl-4 border-l-2 border-amber/30 divide-y divide-charcoal/10">
      {law.sections.map((s) => (
        <li key={s.id} className="py-3 md:py-4 first:pt-2">
          <Link
            href={`/laws/${law.id}/${s.id}`}
            className="group flex flex-col gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/50 rounded-md"
          >
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="font-mono text-legal-blue text-[12px] md:text-[13px] uppercase tracking-[0.1em]">
                {s.section_number}
              </span>
              <span className="font-serif text-[15px] md:text-[16px] text-charcoal group-hover:text-amber transition-colors">
                {s.section_title}
              </span>
            </div>
            <p className="font-sans text-[13.5px] md:text-[14.5px] text-charcoal/65 leading-relaxed">
              {s.plain_english}
            </p>
            <span
              aria-hidden
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-charcoal/35 group-hover:text-amber transition-colors mt-0.5"
            >
              Open section →
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

function EmptyState() {
  return (
    <div className="border-y border-charcoal/10 py-16 md:py-20 text-center px-4">
      <p className="label-smallcaps text-charcoal/45">No laws yet</p>
      <p className="font-serif text-[20px] md:text-2xl text-charcoal/75 mt-3">
        The legal index hasn&apos;t been seeded yet.
      </p>
      <p className="font-sans text-[14px] md:text-[15px] text-charcoal/55 mt-2 max-w-md mx-auto">
        Re-run <code className="font-mono text-[12px]">npm run seed</code> in
        the API workspace to populate every Act tracked on The Record.
      </p>
    </div>
  );
}
