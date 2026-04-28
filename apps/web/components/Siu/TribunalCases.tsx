"use client";

/**
 * TribunalCases — the Special Tribunal section of /siu.
 *
 * Renders the Tribunal singleton context (a one-line explainer) followed by
 * the full caseload sorted by `value_rands DESC NULLS LAST`. The biggest
 * cases lead, mirroring the editorial brief.
 *
 * Layout:
 *   • Mobile (< md): stacked cards, one per case.
 *   • Desktop (md+): table-style row grid (case number / title / value /
 *     status / outcome).
 *
 * Status colouring is driven by `tribunalCaseStatusDescriptor` in
 * `lib/siu.ts`. The "hearing" status renders a pulsing dot via the same
 * `animate-record-pulse` keyframe defined in `globals.css`.
 */

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

import type {
  SpecialTribunal,
  SpecialTribunalCase,
} from "@the-record/shared-types";

import { formatLongDate, formatRandsCompact } from "@/lib/commissions";
import { tribunalCaseStatusDescriptor } from "@/lib/siu";

const EASE = [0.22, 1, 0.36, 1] as const;

interface TribunalCasesProps {
  tribunal: SpecialTribunal;
  cases: ReadonlyArray<SpecialTribunalCase>;
}

export default function TribunalCases({ tribunal, cases }: TribunalCasesProps) {
  // The API already sorts cases by value_rands DESC; resort defensively in
  // case the caller passes an unsorted slice. `null` values sink to the end.
  const sorted = useMemo(() => {
    return [...cases].sort((a, b) => {
      const va = a.value_rands ? Number(a.value_rands) : -1;
      const vb = b.value_rands ? Number(b.value_rands) : -1;
      if (vb !== va) return vb - va;
      return a.case_number.localeCompare(b.case_number);
    });
  }, [cases]);

  return (
    <section
      aria-labelledby="siu-tribunal-heading"
      className="bg-cream border-t border-charcoal/10"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <p className="label-smallcaps text-amber mb-3">Civil court</p>
        <h2
          id="siu-tribunal-heading"
          className="font-serif text-[28px] md:text-4xl lg:text-[44px] leading-[1.1] tracking-[-0.01em] text-charcoal"
        >
          The Special Tribunal.
        </h2>
        <p className="mt-3 max-w-2xl font-sans text-[14px] md:text-base text-charcoal/65">
          Established 2019. Hears only SIU civil matters. Faster and cheaper
          than High Courts — and the only court empowered to set aside
          state contracts won through corruption.
        </p>

        <p className="mt-2 max-w-2xl font-sans text-[12px] md:text-[13px] leading-relaxed text-charcoal/50">
          {tribunal.plain_english_summary}
        </p>

        {sorted.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <DesktopTable cases={sorted} />
            <MobileCards cases={sorted} />
          </>
        )}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="mt-10 md:mt-14 py-12 md:py-16 text-center border border-dashed border-charcoal/15 rounded-2xl">
      <p className="label-smallcaps text-charcoal/50 mb-2">
        No cases on file
      </p>
      <p className="font-serif text-xl md:text-2xl text-charcoal/75">
        The Special Tribunal caseload hasn&apos;t been seeded yet.
      </p>
    </div>
  );
}

// =============================================================================
// Desktop — table-style row grid
// =============================================================================

function DesktopTable({ cases }: { cases: ReadonlyArray<SpecialTribunalCase> }) {
  const reduce = useReducedMotion() ?? false;

  return (
    <div className="hidden md:block mt-10 md:mt-14">
      <div
        role="table"
        aria-label="Special Tribunal cases sorted by value"
        className="border-t border-charcoal/10"
      >
        <div
          role="row"
          className="hidden md:grid grid-cols-[120px_minmax(0,1fr)_120px_180px] gap-4 px-2 py-3 border-b border-charcoal/10 font-mono text-[10px] lg:text-[11px] uppercase tracking-[0.18em] text-charcoal/50"
        >
          <span role="columnheader">Case</span>
          <span role="columnheader">Title · Outcome</span>
          <span role="columnheader" className="text-right">
            Value
          </span>
          <span role="columnheader">Status</span>
        </div>

        <div role="rowgroup">
          {cases.map((c, idx) => (
            <DesktopRow key={c.id} caseRow={c} index={idx} reduce={reduce} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DesktopRow({
  caseRow,
  index,
  reduce,
}: {
  caseRow: SpecialTribunalCase;
  index: number;
  reduce: boolean;
}) {
  const status = tribunalCaseStatusDescriptor(
    caseRow.status,
    caseRow.amount_recovered_rands,
  );
  return (
    <motion.div
      role="row"
      initial={{ opacity: 0, y: reduce ? 0 : 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: reduce ? 0.001 : 0.32,
        delay: reduce ? 0 : Math.min(index * 0.04, 0.4),
        ease: EASE,
      }}
      className="grid grid-cols-[120px_minmax(0,1fr)_120px_180px] gap-4 px-2 py-5 border-b border-charcoal/10 items-baseline"
    >
      <span
        role="cell"
        className="font-mono text-[12px] lg:text-[13px] tracking-[0.06em] text-charcoal/80"
      >
        {caseRow.case_number}
      </span>

      <div role="cell" className="min-w-0">
        <p className="font-serif text-[18px] lg:text-[20px] leading-[1.25] text-charcoal">
          {caseRow.case_title}
        </p>
        <p className="mt-1.5 font-sans text-[13px] text-charcoal/65 line-clamp-2">
          {caseRow.outcome_summary ??
            caseRow.plain_english_outcome ??
            caseRow.nature_of_claim}
        </p>
        {caseRow.respondents.length > 0 ? (
          <p className="mt-1.5 font-mono text-[10px] lg:text-[11px] uppercase tracking-[0.16em] text-charcoal/45 truncate">
            v.&nbsp;{caseRow.respondents.slice(0, 3).join(" · ")}
            {caseRow.respondents.length > 3
              ? ` +${caseRow.respondents.length - 3}`
              : ""}
          </p>
        ) : null}
        {caseRow.filed_date ? (
          <p className="mt-1.5 font-mono text-[10px] lg:text-[11px] uppercase tracking-[0.16em] text-charcoal/45">
            Filed {formatLongDate(caseRow.filed_date)}
          </p>
        ) : null}
      </div>

      <div
        role="cell"
        className="text-right font-serif text-[20px] lg:text-[24px] leading-none text-charcoal"
      >
        {formatRandsCompact(caseRow.value_rands)}
        {caseRow.amount_recovered_rands ? (
          <p className="mt-1 font-mono text-[10px] lg:text-[11px] uppercase tracking-[0.16em] text-amber">
            {formatRandsCompact(caseRow.amount_recovered_rands)} recovered
          </p>
        ) : null}
      </div>

      <div role="cell" className="flex items-start">
        <StatusPill
          bg={status.bg}
          text={status.text}
          dot={status.dot}
          label={status.label}
          dotPulse={status.dotPulse}
        />
      </div>
    </motion.div>
  );
}

// =============================================================================
// Mobile — stacked cards
// =============================================================================

function MobileCards({ cases }: { cases: ReadonlyArray<SpecialTribunalCase> }) {
  const reduce = useReducedMotion() ?? false;
  return (
    <ul className="md:hidden mt-8 flex flex-col gap-3">
      {cases.map((c, idx) => {
        const status = tribunalCaseStatusDescriptor(
          c.status,
          c.amount_recovered_rands,
        );
        return (
          <motion.li
            key={c.id}
            initial={{ opacity: 0, y: reduce ? 0 : 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: reduce ? 0.001 : 0.32,
              delay: reduce ? 0 : Math.min(idx * 0.05, 0.4),
              ease: EASE,
            }}
            className="bg-white rounded-xl border border-charcoal/10 p-5"
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="font-mono text-[11px] tracking-[0.06em] text-charcoal/70">
                {c.case_number}
              </span>
              <StatusPill
                bg={status.bg}
                text={status.text}
                dot={status.dot}
                label={status.label}
                dotPulse={status.dotPulse}
                compact
              />
            </div>

            <h3 className="font-serif text-[18px] leading-[1.2] text-charcoal">
              {c.case_title}
            </h3>

            {c.respondents.length > 0 ? (
              <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-charcoal/45">
                v.&nbsp;{c.respondents.slice(0, 3).join(" · ")}
                {c.respondents.length > 3 ? ` +${c.respondents.length - 3}` : ""}
              </p>
            ) : null}

            <p className="mt-3 font-sans text-[13px] leading-relaxed text-charcoal/70 line-clamp-3">
              {c.outcome_summary ?? c.plain_english_outcome ?? c.nature_of_claim}
            </p>

            <div className="mt-4 pt-4 border-t border-charcoal/[0.07] flex items-end justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-charcoal/50">
                  Value
                </p>
                <p className="font-serif text-[22px] leading-none text-charcoal">
                  {formatRandsCompact(c.value_rands)}
                </p>
              </div>
              {c.amount_recovered_rands ? (
                <div className="text-right">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber">
                    Recovered
                  </p>
                  <p className="font-serif text-[20px] leading-none text-amber">
                    {formatRandsCompact(c.amount_recovered_rands)}
                  </p>
                </div>
              ) : c.filed_date ? (
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-charcoal/45 text-right">
                  Filed
                  <br />
                  {formatLongDate(c.filed_date)}
                </p>
              ) : null}
            </div>
          </motion.li>
        );
      })}
    </ul>
  );
}

// =============================================================================
// Status pill — shared between desktop + mobile so colour rules stay in sync.
// =============================================================================

function StatusPill({
  bg,
  text,
  dot,
  label,
  dotPulse,
  compact,
}: {
  bg: string;
  text: string;
  dot: string;
  label: string;
  dotPulse: boolean;
  compact?: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 whitespace-nowrap",
        compact ? "px-2 py-0.5" : "px-2.5 py-1",
        "rounded-full",
        compact ? "text-[10px]" : "text-[10px] md:text-[11px]",
        "font-mono uppercase tracking-[0.14em]",
        bg,
        text,
      ].join(" ")}
    >
      <span aria-hidden className="relative inline-flex h-1.5 w-1.5">
        {dotPulse ? (
          <span
            className={`absolute inline-flex h-full w-full rounded-full ${dot} animate-record-pulse`}
          />
        ) : null}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dot}`} />
      </span>
      {label}
    </span>
  );
}
