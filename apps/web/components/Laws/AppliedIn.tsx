"use client";

/**
 * "Applied in:" — the cross-link strip beneath every law section. This is
 * the editorial heart of the section page: a reader looking up Section 5
 * of PRECCA wants to see, at a glance, every commission, committee and
 * story where that section has actually been invoked or alleged.
 *
 * Mobile: each category is a collapsible accordion (default-open if it has
 * any rows so first-load scroll naturally lands on real content).
 * Desktop (md+): a 2-column grid with all categories expanded — the
 * accordion chrome is hidden because the desktop layout has space for both
 * stacks side-by-side.
 *
 * SIU rows come from `siu_proclamation_law_sections` via
 * `LawSectionDetail.siu_proclamations` (separate from commission usage types).
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

import { adhocCategoryChipClasses, ADHOC_CATEGORY_LABELS } from "@/lib/adhoc";
import { domainChipClasses } from "@/lib/commissions";
import { adhocUsageChip, commissionUsageChip, siuUsageChip } from "@/lib/laws";
import type {
  AdhocCommitteeUsingLawSection,
  CommissionUsingLawSection,
  SiuProclamationCitingSection,
  StoryReferencingLawSection,
} from "@the-record/shared-types";

interface AppliedInProps {
  commissions: CommissionUsingLawSection[];
  adhocCommittees: AdhocCommitteeUsingLawSection[];
  stories: StoryReferencingLawSection[];
  siuProclamations: SiuProclamationCitingSection[];
}

export default function AppliedIn({
  commissions,
  adhocCommittees,
  stories,
  siuProclamations,
}: AppliedInProps) {
  const total =
    commissions.length +
    adhocCommittees.length +
    stories.length +
    siuProclamations.length;

  if (total === 0) {
    return <EmptyState />;
  }

  return (
    <section
      aria-labelledby="applied-in-heading"
      className="border-t border-charcoal/10 pt-10 md:pt-14"
    >
      <header className="mb-7 md:mb-10">
        <p className="label-smallcaps text-charcoal/50">Cross-references</p>
        <h2
          id="applied-in-heading"
          className="font-serif text-[26px] md:text-[34px] leading-tight text-charcoal mt-2"
        >
          This section appears in:
        </h2>
        <p className="font-sans text-[14.5px] md:text-[16px] text-charcoal/65 mt-3 max-w-2xl">
          Every commission, committee, SIU investigation and story on The
          Record where this section has been invoked, investigated, or alleged
          to have been violated.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-10">
        <Category
          title="Commissions of Inquiry"
          subtitle="Executive (s84(2)(f))"
          count={commissions.length}
        >
          {commissions.length === 0 ? (
            <CategoryEmpty>
              No commissions on record have invoked this section.
            </CategoryEmpty>
          ) : (
            <ul className="space-y-3 md:space-y-4">
              {commissions.map((c) => (
                <CommissionRow key={`${c.id}-${c.usage_type}`} commission={c} />
              ))}
            </ul>
          )}
        </Category>

        <Category
          title="Ad Hoc Committees"
          subtitle="Legislature (NA Rule 253)"
          count={adhocCommittees.length}
        >
          {adhocCommittees.length === 0 ? (
            <CategoryEmpty>
              No ad hoc committees on record have processed this section.
            </CategoryEmpty>
          ) : (
            <ul className="space-y-3 md:space-y-4">
              {adhocCommittees.map((a) => (
                <AdhocRow key={`${a.id}-${a.usage_type}`} committee={a} />
              ))}
            </ul>
          )}
        </Category>

        <Category
          title="SIU Investigations"
          subtitle="Presidential proclamations (SIU Act)"
          count={siuProclamations.length}
        >
          {siuProclamations.length === 0 ? (
            <CategoryEmpty>
              No SIU proclamations on record cite this section yet.
            </CategoryEmpty>
          ) : (
            <ul className="space-y-3 md:space-y-4">
              {siuProclamations.map((row) => (
                <SiuRow key={row.id} row={row} />
              ))}
            </ul>
          )}
        </Category>

        <div className="md:col-span-2">
          <Category
            title="Stories & Events"
            subtitle="Where this section appears on the timeline"
            count={stories.length}
          >
            {stories.length === 0 ? (
              <CategoryEmpty>
                No story timelines yet cite this section.
              </CategoryEmpty>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {stories.map((s) => (
                  <StoryRow key={s.id} story={s} />
                ))}
              </ul>
            )}
          </Category>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Category wrapper — accordion on mobile, plain heading on desktop.
// -----------------------------------------------------------------------------

interface CategoryProps {
  title: string;
  subtitle: string;
  count: number;
  children: React.ReactNode;
}

function Category({ title, subtitle, count, children }: CategoryProps) {
  const reduceMotion = useReducedMotion();
  // Default-open if the category has any rows — first-load scroll should
  // hit real content, not collapsed chrome.
  const [isOpen, setIsOpen] = useState(count > 0);

  return (
    <section className="rounded-2xl border border-charcoal/10 bg-cream/60 overflow-hidden">
      {/* Mobile-only header (functions as accordion toggle). */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="md:hidden w-full flex items-center justify-between gap-4 px-5 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-inset"
      >
        <CategoryHeading title={title} subtitle={subtitle} count={count} />
        <ChevronIcon isOpen={isOpen} />
      </button>

      {/* Desktop-only static header. */}
      <div className="hidden md:block px-6 lg:px-7 pt-6 pb-4 border-b border-charcoal/10">
        <CategoryHeading title={title} subtitle={subtitle} count={count} />
      </div>

      {/* Body — animated only on mobile (desktop is always open). */}
      <div className="md:block">
        <div className="md:hidden">
          <AnimatePresence initial={false}>
            {isOpen ? (
              <motion.div
                key="body-mobile"
                initial={
                  reduceMotion ? { opacity: 1 } : { opacity: 0, height: 0 }
                }
                animate={
                  reduceMotion
                    ? { opacity: 1 }
                    : { opacity: 1, height: "auto" }
                }
                exit={
                  reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }
                }
                transition={{
                  duration: reduceMotion ? 0 : 0.28,
                  ease: [0.4, 0, 0.2, 1],
                }}
                className="overflow-hidden"
              >
                <div className="px-5 pt-2 pb-5">{children}</div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="hidden md:block px-6 lg:px-7 py-6">{children}</div>
      </div>
    </section>
  );
}

function CategoryHeading({
  title,
  subtitle,
  count,
}: {
  title: string;
  subtitle: string;
  count: number;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <div className="flex items-baseline gap-3 flex-wrap">
        <h3 className="font-serif text-[19px] md:text-[20px] text-charcoal">
          {title}
        </h3>
        <span className="font-mono text-[12px] text-charcoal/55 tabular-nums">
          {count}
        </span>
      </div>
      <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.16em] text-charcoal/45">
        {subtitle}
      </span>
    </div>
  );
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <span
      aria-hidden
      className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full border border-charcoal/15 text-charcoal/55"
    >
      <motion.svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        animate={{ rotate: isOpen ? 180 : 0 }}
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

function CategoryEmpty({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-sans text-[14px] md:text-[14.5px] text-charcoal/55 italic">
      {children}
    </p>
  );
}

// -----------------------------------------------------------------------------
// Rows
// -----------------------------------------------------------------------------

function CommissionRow({
  commission: c,
}: {
  commission: CommissionUsingLawSection;
}) {
  const usage = commissionUsageChip(c.usage_type);
  const domain = domainChipClasses(c.domain);

  return (
    <li className="border-b border-charcoal/10 last:border-b-0 pb-3 md:pb-4 last:pb-0">
      <Link
        href={`/commissions/${c.slug}`}
        className="group flex flex-col gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/50 rounded-md"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span
            aria-label={usage.longLabel}
            title={usage.longLabel}
            className={`font-mono text-[10px] uppercase tracking-[0.14em] border ${usage.bg} ${usage.text} ${usage.border} rounded-full px-2 py-0.5`}
          >
            {usage.label}
          </span>
          <span
            className={`font-mono text-[10px] uppercase tracking-[0.14em] border ${domain.bg} ${domain.text} ${domain.border} rounded-full px-2 py-0.5`}
          >
            {c.domain.replace(/_/g, " ")}
          </span>
          {c.era_year ? (
            <span className="font-mono text-[11px] text-charcoal/45 tabular-nums">
              {c.era_year}
            </span>
          ) : null}
        </div>
        <p className="font-serif text-[16px] md:text-[17px] text-charcoal group-hover:text-amber transition-colors leading-snug">
          {c.popular_name}
        </p>
        {c.chair_name ? (
          <p className="font-sans text-[12.5px] text-charcoal/55">
            Chair · {c.chair_name}
          </p>
        ) : null}
      </Link>
    </li>
  );
}

/**
 * Ad hoc committees render as static rows (not links) because the
 * `/adhoc-committees/[slug]` detail page hasn't shipped yet. Mirroring
 * `AccountabilityIndex` here so we never route readers to a 404 — when
 * the detail page lands, swap the wrapping `<div>` for a `<Link>`.
 */
function AdhocRow({
  committee: a,
}: {
  committee: AdhocCommitteeUsingLawSection;
}) {
  const usage = adhocUsageChip(a.usage_type);
  const cat = adhocCategoryChipClasses(a.category);

  return (
    <li className="border-b border-charcoal/10 last:border-b-0 pb-3 md:pb-4 last:pb-0">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            aria-label={usage.longLabel}
            title={usage.longLabel}
            className={`font-mono text-[10px] uppercase tracking-[0.14em] border ${usage.bg} ${usage.text} ${usage.border} rounded-full px-2 py-0.5`}
          >
            {usage.label}
          </span>
          <span
            className={`font-mono text-[10px] uppercase tracking-[0.14em] border ${cat.bg} ${cat.text} ${cat.border} rounded-full px-2 py-0.5`}
          >
            {ADHOC_CATEGORY_LABELS[a.category]}
          </span>
          {a.parliament_term ? (
            <span className="font-mono text-[11px] text-charcoal/45">
              {a.parliament_term}
            </span>
          ) : a.era_year ? (
            <span className="font-mono text-[11px] text-charcoal/45 tabular-nums">
              {a.era_year}
            </span>
          ) : null}
        </div>
        <p className="font-serif text-[16px] md:text-[17px] text-charcoal leading-snug">
          {a.popular_name}
        </p>
      </div>
    </li>
  );
}

function SiuRow({ row }: { row: SiuProclamationCitingSection }) {
  const p = row.proclamation;
  const usage = siuUsageChip(row.usage_type);

  return (
    <li className="border-b border-charcoal/10 last:border-b-0 pb-3 md:pb-4 last:pb-0">
      <Link
        href={`/siu/proclamations/${encodeURIComponent(p.slug)}`}
        className="group flex flex-col gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/50 rounded-md"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="font-mono text-[10px] md:text-[11px] tracking-[0.1em] text-[#E07A5F] tabular-nums"
            title="Proclamation number"
          >
            {p.proclamation_number}
          </span>
          <span
            aria-label={usage.longLabel}
            title={usage.longLabel}
            className={`font-mono text-[10px] uppercase tracking-[0.14em] border ${usage.bg} ${usage.text} ${usage.border} rounded-full px-2 py-0.5`}
          >
            {usage.label}
          </span>
        </div>
        <p className="font-serif text-[16px] md:text-[17px] text-charcoal group-hover:text-amber transition-colors leading-snug">
          {p.title}
        </p>
        {row.relevance ? (
          <p className="font-sans text-[13px] text-charcoal/55 italic leading-relaxed">
            {row.relevance}
          </p>
        ) : null}
      </Link>
    </li>
  );
}

function StoryRow({ story: s }: { story: StoryReferencingLawSection }) {
  return (
    <li className="rounded-xl border border-charcoal/10 bg-cream p-4 md:p-5 hover:border-amber/40 transition-colors">
      <Link
        href={`/stories/${s.slug}`}
        className="group flex flex-col gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/50 rounded-md"
      >
        <div className="flex items-center gap-2 flex-wrap">
          {s.alleged_violation ? (
            <span
              title="Flagged as an alleged violation"
              className="font-mono text-[10px] uppercase tracking-[0.14em] border bg-charge-red/10 text-charge-red border-charge-red/25 rounded-full px-2 py-0.5"
            >
              Alleged violation
            </span>
          ) : null}
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-charcoal/55">
            {s.domain.replace(/_/g, " ")}
          </span>
          {s.latest_event_date ? (
            <span className="font-mono text-[11px] text-charcoal/45 tabular-nums">
              {formatShortDate(s.latest_event_date)}
            </span>
          ) : null}
        </div>
        <p className="font-serif text-[16px] md:text-[17px] text-charcoal group-hover:text-amber transition-colors leading-snug">
          {s.title}
        </p>
        {s.summary ? (
          <p className="font-sans text-[13.5px] text-charcoal/65 leading-relaxed line-clamp-3">
            {s.summary}
          </p>
        ) : null}
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-charcoal/45">
          {s.event_count} {s.event_count === 1 ? "event" : "events"} cite this
          section
        </p>
      </Link>
    </li>
  );
}

// -----------------------------------------------------------------------------
// Empty state — no cross-links of any kind for this section yet.
// -----------------------------------------------------------------------------

function EmptyState() {
  return (
    <section
      aria-labelledby="applied-in-heading"
      className="border-t border-charcoal/10 pt-10 md:pt-14"
    >
      <header>
        <p className="label-smallcaps text-charcoal/50">Cross-references</p>
        <h2
          id="applied-in-heading"
          className="font-serif text-[26px] md:text-[34px] leading-tight text-charcoal mt-2"
        >
          This section appears in:
        </h2>
      </header>

      <div className="mt-7 rounded-2xl border border-dashed border-charcoal/15 bg-cream/60 p-6 md:p-8 text-center">
        <p className="font-serif text-[19px] md:text-[22px] text-charcoal/75">
          No commissions, committees, SIU proclamations or stories on The Record
          have invoked this section yet.
        </p>
        <p className="font-sans text-[14px] md:text-[15px] text-charcoal/55 mt-3 max-w-md mx-auto">
          When this section is tied to an investigation or cited in a future
          event, this page will list every place it appears — automatically.
        </p>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function formatShortDate(iso: string): string {
  // ISO `YYYY-MM-DD` → `Sep 2025` (compact, locale-aware). Fall back to the
  // raw string when parsing fails so we never hide actual data.
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    year: "numeric",
    timeZone: "Africa/Johannesburg",
  }).format(d);
}
