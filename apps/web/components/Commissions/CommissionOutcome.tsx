/**
 * CommissionOutcome — "What happened" section. Shows outcome_summary narrative
 * and a prominent prosecution-indicator block. For commissions that returned
 * `produced_prosecutions === false`, we surface an amber warning box: the
 * whole point of the index is to make the accountability gap visible.
 *
 * Server Component.
 */

import Link from "next/link";

import type { CommissionDetail } from "@the-record/shared-types";

import { formatLongDate, prosecutionDescriptor } from "@/lib/commissions";

interface CommissionOutcomeProps {
  commission: CommissionDetail;
}

export default function CommissionOutcome({
  commission,
}: CommissionOutcomeProps) {
  const hasNarrative = Boolean(commission.outcome_summary?.trim());
  const hasReport = Boolean(commission.report_url);
  const hasReportDate = Boolean(commission.report_released_date);

  // If a commission has no outcome narrative, no report, AND no prosecution
  // signal, there's nothing to show — skip the section entirely.
  if (
    !hasNarrative &&
    !hasReport &&
    !hasReportDate &&
    commission.produced_prosecutions == null
  ) {
    return null;
  }

  return (
    <section
      aria-labelledby="commission-outcome-heading"
      className="border-t border-charcoal/10 py-8 md:py-12 flex flex-col gap-5 md:gap-7"
    >
      <div>
        <p className="label-smallcaps text-amber mb-2">Outcome</p>
        <h2
          id="commission-outcome-heading"
          className="font-serif text-[24px] md:text-3xl lg:text-[36px] leading-tight text-charcoal max-w-3xl"
        >
          What happened.
        </h2>
      </div>

      {hasReportDate ? (
        <p className="font-mono text-[11px] md:text-xs uppercase tracking-[0.18em] text-charcoal/55">
          Report released · {formatLongDate(commission.report_released_date)}
        </p>
      ) : null}

      {commission.outcome_summary ? (
        <p className="font-sans text-base md:text-lg leading-relaxed text-charcoal/85 max-w-3xl">
          {commission.outcome_summary}
        </p>
      ) : null}

      <ProsecutionBlock value={commission.produced_prosecutions} />

      {hasReport ? (
        <a
          href={commission.report_url ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start inline-flex items-center gap-2 bg-charcoal text-cream rounded-full px-5 py-2.5 font-mono text-[11px] md:text-xs uppercase tracking-[0.18em] hover:bg-amber transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-amber/40"
        >
          Read the full report
          <span aria-hidden>→</span>
        </a>
      ) : null}
    </section>
  );
}

// =============================================================================
// Prosecution indicator
// =============================================================================

function ProsecutionBlock({ value }: { value: boolean | null }) {
  const d = prosecutionDescriptor(value);

  if (value === false) {
    return (
      <aside
        aria-label="No prosecutions resulted"
        className="relative bg-amber/10 border-l-4 border-amber rounded-r-xl md:rounded-r-2xl px-5 md:px-7 py-5 md:py-6 flex flex-col gap-3 max-w-3xl"
      >
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-lg md:text-xl">
            ⚠
          </span>
          <span className="label-smallcaps text-amber">
            Accountability gap
          </span>
        </div>
        <p className="font-serif text-[18px] md:text-xl leading-snug text-charcoal">
          No prosecutions resulted from this commission.
        </p>
        <p className="font-sans text-[13px] md:text-sm leading-relaxed text-charcoal/70">
          The inquiry concluded and findings were published, but no one was
          charged as a direct consequence of the evidence presented here.
          That is a pattern we track on The Record — not an anomaly.
        </p>
        <Link
          href="/commissions"
          className="self-start font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-amber hover:underline underline-offset-4"
        >
          See other commissions with no prosecutions →
        </Link>
      </aside>
    );
  }

  return (
    <div
      className={[
        "inline-flex items-center gap-3 self-start",
        "px-5 py-3 rounded-full bg-white border border-charcoal/10",
      ].join(" ")}
    >
      <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${d.dotClass}`} />
      <span
        className={`font-mono text-[11px] md:text-xs uppercase tracking-[0.18em] ${d.textClass}`}
      >
        {d.label}
      </span>
    </div>
  );
}
