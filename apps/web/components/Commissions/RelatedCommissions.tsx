/**
 * RelatedCommissions — two columns of small editorial links.
 *
 * 1. "Other commissions in this domain"
 * 2. "Commissions involving the same people"
 *
 * Rendered as plain rows, separated by a thin line — same visual language
 * as the main index page so nothing feels like a new component.
 *
 * Server Component.
 */

import Link from "next/link";

import type {
  CommissionDomain,
  CommissionSummary,
} from "@the-record/shared-types";

import {
  COMMISSION_DOMAIN_LABELS,
  commissionEraYear,
  statusBadgeClasses,
} from "@/lib/commissions";

interface RelatedCommissionsProps {
  currentSlug: string;
  currentDomain: CommissionDomain;
  sameDomain: CommissionSummary[];
  samePeople: Array<{
    commission: CommissionSummary;
    shared_people: string[];
  }>;
}

const MAX_PER_GROUP = 6;

export default function RelatedCommissions({
  currentSlug,
  currentDomain,
  sameDomain,
  samePeople,
}: RelatedCommissionsProps) {
  const domainSiblings = sameDomain
    .filter((c) => c.slug !== currentSlug)
    .slice(0, MAX_PER_GROUP);

  if (domainSiblings.length === 0 && samePeople.length === 0) return null;

  return (
    <section
      aria-labelledby="commission-related-heading"
      className="bg-charcoal/[0.04] border-t border-charcoal/10"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <p className="label-smallcaps text-amber mb-2">Related</p>
        <h2
          id="commission-related-heading"
          className="font-serif text-[24px] md:text-3xl lg:text-[36px] leading-tight text-charcoal max-w-3xl"
        >
          The threads that connect this commission.
        </h2>

        <div className="mt-8 md:mt-12 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12">
          {domainSiblings.length > 0 ? (
            <Group
              title={`Other commissions in ${COMMISSION_DOMAIN_LABELS[currentDomain]}`}
              emptyLabel="None"
            >
              {domainSiblings.map((c) => (
                <li key={c.id}>
                  <CommissionLink commission={c} />
                </li>
              ))}
            </Group>
          ) : null}

          {samePeople.length > 0 ? (
            <Group
              title="Commissions involving the same people"
              emptyLabel="No overlap detected"
            >
              {samePeople.map(({ commission, shared_people }) => (
                <li key={commission.id}>
                  <CommissionLink
                    commission={commission}
                    sharedPeople={shared_people}
                  />
                </li>
              ))}
            </Group>
          ) : null}
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// Group
// =============================================================================

function Group({
  title,
  children,
  emptyLabel,
}: {
  title: string;
  children: React.ReactNode;
  emptyLabel: string;
}) {
  const isEmpty =
    Array.isArray(children) ? children.length === 0 : !children;

  return (
    <div className="flex flex-col gap-4">
      <h3 className="label-smallcaps text-charcoal/55">{title}</h3>
      {isEmpty ? (
        <p className="font-sans text-sm text-charcoal/45 italic">
          {emptyLabel}
        </p>
      ) : (
        <ul className="flex flex-col">{children}</ul>
      )}
    </div>
  );
}

// =============================================================================
// Link row
// =============================================================================

function CommissionLink({
  commission,
  sharedPeople,
}: {
  commission: CommissionSummary;
  sharedPeople?: string[];
}) {
  const year = commissionEraYear(commission);
  const status = statusBadgeClasses(commission.status);

  return (
    <Link
      href={`/commissions/${commission.slug}`}
      className="group flex flex-col gap-1.5 py-3 md:py-4 border-b border-charcoal/10 hover:border-amber/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/40 rounded-sm -mx-1 px-1"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-charcoal/50">
          {year}
        </span>
        <span
          className={[
            "inline-flex items-center gap-1 whitespace-nowrap",
            "px-2 py-0.5 rounded-full",
            "font-mono text-[9px] md:text-[10px] uppercase tracking-[0.14em]",
            status.bg,
            status.text,
          ].join(" ")}
        >
          <span
            aria-hidden
            className={`h-1 w-1 rounded-full ${status.dot}`}
          />
          {status.label}
        </span>
      </div>

      <span className="font-serif text-[16px] md:text-lg leading-snug text-charcoal group-hover:text-amber transition-colors">
        {commission.popular_name}
      </span>

      {sharedPeople && sharedPeople.length > 0 ? (
        <span className="font-sans text-[12px] md:text-[13px] text-charcoal/60 leading-relaxed">
          <span className="font-medium text-charcoal/80">
            Shared {sharedPeople.length === 1 ? "figure" : "figures"}:
          </span>{" "}
          {sharedPeople.slice(0, 3).join(", ")}
          {sharedPeople.length > 3
            ? ` + ${sharedPeople.length - 3} more`
            : ""}
        </span>
      ) : null}
    </Link>
  );
}
