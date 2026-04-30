/**
 * Horizontal fiscal + calendar context for a commission detail page.
 */

import {
  formatAnnouncedToConcludedDuration,
  formatRandsCompact,
  formatRandsFull,
} from "@/lib/commissions";

export interface CommissionCostPanelProps {
  cost_rands: number | null;
  total_hearing_days: number | null;
  announced_date: string | null;
  concluded_date: string | null;
  commissionName: string;
}

export default function CommissionCostPanel({
  cost_rands,
  total_hearing_days,
  announced_date,
  concluded_date,
  commissionName,
}: CommissionCostPanelProps) {
  const duration = formatAnnouncedToConcludedDuration(
    announced_date,
    concluded_date,
  );

  const costPerDay =
    cost_rands != null &&
    total_hearing_days != null &&
    total_hearing_days > 0
      ? Math.round(cost_rands / total_hearing_days)
      : null;

  return (
    <section
      aria-label={`Cost and duration for ${commissionName}`}
      className="border-y border-charcoal/10 bg-charcoal/[0.02] -mx-4 px-4 py-6 md:mx-0 md:px-0 md:py-8"
    >
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8 lg:gap-10">
        <div className="col-span-2 md:col-span-1 min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-charcoal/50 mb-2">
            Estimated cost to taxpayer
          </p>
          {cost_rands != null && cost_rands > 0 ? (
            <p className="font-serif text-[28px] md:text-4xl lg:text-[42px] leading-none text-amber">
              {formatRandsFull(cost_rands)}
            </p>
          ) : (
            <p className="font-serif text-xl md:text-2xl text-charcoal/45">
              Cost not yet disclosed
            </p>
          )}
        </div>

        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-charcoal/50 mb-2">
            Duration
          </p>
          <p className="font-sans text-[15px] md:text-base font-medium text-charcoal leading-snug">
            {duration}
          </p>
        </div>

        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-charcoal/50 mb-2">
            Sitting days
          </p>
          <p className="font-sans text-[15px] md:text-base font-medium text-charcoal">
            {total_hearing_days != null && total_hearing_days > 0
              ? String(total_hearing_days)
              : "—"}
          </p>
        </div>

        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-charcoal/50 mb-2">
            Cost per sitting day
          </p>
          <p className="font-sans text-[15px] md:text-base font-medium text-charcoal">
            {costPerDay != null && costPerDay > 0
              ? `${formatRandsCompact(costPerDay)}/day`
              : "—"}
          </p>
        </div>
      </div>

      <p className="mt-5 md:mt-6 max-w-2xl font-sans text-[11px] leading-relaxed text-charcoal/50 italic">
        Cost figures are sourced from parliamentary questions and
        auditor-general reports. Some figures are estimates.
      </p>
    </section>
  );
}
