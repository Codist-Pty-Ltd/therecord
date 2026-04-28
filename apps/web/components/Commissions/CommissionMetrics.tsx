/**
 * CommissionMetrics — horizontal strip of amber-accented metrics. Only
 * rendered when at least one of the three metrics has a value; otherwise the
 * commission page skips this section altogether (no empty chrome).
 *
 * Server Component.
 */

import type { CommissionDetail } from "@the-record/shared-types";

import {
  durationInDays,
  formatDurationDays,
  formatRandsCompact,
} from "@/lib/commissions";

interface CommissionMetricsProps {
  commission: CommissionDetail;
}

export default function CommissionMetrics({
  commission,
}: CommissionMetricsProps) {
  const duration = durationInDays(
    commission.announced_date ?? commission.hearings_started,
    commission.concluded_date ?? commission.report_released_date,
  );

  const cells: Array<{ label: string; value: string; isPlaceholder: boolean }> =
    [
      {
        label: "Duration",
        value: formatDurationDays(duration),
        isPlaceholder: duration == null,
      },
      {
        label: "Hearing days",
        value:
          commission.total_hearing_days != null
            ? String(commission.total_hearing_days)
            : "—",
        isPlaceholder: commission.total_hearing_days == null,
      },
      {
        label: "Cost to taxpayer",
        value: formatRandsCompact(commission.cost_rands),
        isPlaceholder: !commission.cost_rands,
      },
    ];

  // Don't render the strip at all if every value is a placeholder — keeps
  // the page from showing a row of three em-dashes for early-era commissions.
  const hasAnyRealValue = cells.some((c) => !c.isPlaceholder);
  if (!hasAnyRealValue) return null;

  return (
    <section
      aria-label="Commission metrics"
      className="border-y border-charcoal/10 py-6 md:py-8"
    >
      <dl className="grid grid-cols-3 gap-4 md:gap-10">
        {cells.map((cell) => (
          <div
            key={cell.label}
            className="flex flex-col gap-1.5 md:gap-2 min-w-0"
          >
            <dt className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-charcoal/55">
              {cell.label}
            </dt>
            <dd
              className={[
                "font-serif leading-none truncate",
                "text-[26px] md:text-4xl lg:text-[44px]",
                cell.isPlaceholder ? "text-charcoal/30" : "text-amber",
              ].join(" ")}
            >
              {cell.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
