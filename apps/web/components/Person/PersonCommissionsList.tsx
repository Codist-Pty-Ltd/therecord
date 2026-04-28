import Link from "next/link";

import EmptyState from "@/components/ui/EmptyState";
import {
  COMMISSION_DOMAIN_LABELS,
  COMMISSION_PERSON_ROLE_LABELS,
  domainChipClasses,
  extractYear,
  statusBadgeClasses,
} from "@/lib/commissions";

import type { PersonCommissionAppearance } from "@the-record/shared-types";

interface PersonCommissionsListProps {
  /** Name of the person — used in the empty-state copy. */
  personName: string;
  commissions: PersonCommissionAppearance[];
}

/**
 * "Appeared in N commissions" section. Row-based editorial style: each row
 * is a `(commission × role)` tuple so that someone who chaired a commission
 * AND was a witness at another shows up correctly twice.
 *
 * Rows are pre-sorted oldest → newest by the API (by `announced_date`).
 */
export default function PersonCommissionsList({
  personName,
  commissions,
}: PersonCommissionsListProps) {
  if (commissions.length === 0) {
    return (
      <section
        aria-label="Commission appearances"
        className="border-b border-charcoal/10 py-4 md:py-6"
      >
        <h2 className="label-smallcaps text-charcoal/55 mb-3">
          Commission appearances
        </h2>
        <EmptyState
          className="py-8"
          icon="🏛️"
          heading="No commission appearances yet"
          body={`${personName} is not listed on a national commission of inquiry in The Record yet—new coverage may add this over time.`}
        />
      </section>
    );
  }

  return (
    <section
      aria-label="Commission appearances"
      className="border-b border-charcoal/10 py-8 md:py-12"
    >
      <div className="flex items-end justify-between gap-4 mb-5 md:mb-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="label-smallcaps text-charcoal/55">
            Commission appearances
          </h2>
          <p className="font-serif text-[22px] md:text-3xl text-charcoal leading-[1.1]">
            Appeared in {commissions.length}{" "}
            {commissions.length === 1 ? "commission" : "commissions"}
          </p>
        </div>
      </div>

      <ul className="flex flex-col">
        {commissions.map((c, idx) => (
          <CommissionRow
            key={c.id}
            appearance={c}
            isLast={idx === commissions.length - 1}
          />
        ))}
      </ul>
    </section>
  );
}

function CommissionRow({
  appearance,
  isLast,
}: {
  appearance: PersonCommissionAppearance;
  isLast: boolean;
}) {
  const chip = domainChipClasses(appearance.domain);
  const statusPill = statusBadgeClasses(appearance.status);
  const year = extractYear(
    appearance.announced_date ?? appearance.concluded_date,
  );
  const roleLabel = COMMISSION_PERSON_ROLE_LABELS[appearance.role];
  const domainLabel = COMMISSION_DOMAIN_LABELS[appearance.domain];

  return (
    <li className={isLast ? "" : "border-b border-charcoal/10"}>
      <Link
        href={`/commissions/${appearance.slug}`}
        className="group flex flex-col md:flex-row md:items-center gap-3 md:gap-6 py-5 md:py-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/40 rounded-sm"
      >
        <div className="md:w-16 md:shrink-0 font-mono text-[18px] md:text-[22px] text-charcoal/80 tabular-nums">
          {year}
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={[
                "inline-flex items-center whitespace-nowrap",
                "px-2 py-0.5 md:px-2.5 md:py-1 rounded-md border",
                "font-mono text-[10px] md:text-[11px] uppercase tracking-[0.14em]",
                chip.bg,
                chip.text,
                chip.border,
              ].join(" ")}
            >
              {domainLabel}
            </span>
            <span
              className={[
                "inline-flex items-center gap-1.5 whitespace-nowrap",
                "px-2 py-0.5 rounded-full",
                "font-mono text-[10px] md:text-[11px] uppercase tracking-[0.14em]",
                "shadow-sm",
                statusPill.bg,
                statusPill.text,
              ].join(" ")}
            >
              <span aria-hidden className={`w-1.5 h-1.5 rounded-full ${statusPill.dot}`} />
              {statusPill.label}
            </span>
            <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-legal-blue">
              {roleLabel}
            </span>
          </div>

          <p className="font-serif text-lg md:text-xl leading-snug text-charcoal group-hover:text-amber transition-colors">
            {appearance.popular_name}
          </p>

          {appearance.chair_name ? (
            <p className="font-sans text-[13px] md:text-sm text-charcoal/60">
              Chair · {appearance.chair_name}
            </p>
          ) : null}

          {appearance.summary ? (
            <p className="font-sans text-sm md:text-[15px] text-charcoal/70 leading-relaxed max-w-3xl">
              {appearance.summary}
            </p>
          ) : null}
        </div>

        <span
          aria-hidden
          className="font-mono text-[11px] md:text-xs uppercase tracking-[0.18em] text-charcoal/40 group-hover:text-amber transition-colors"
        >
          Open →
        </span>
      </Link>
    </li>
  );
}
