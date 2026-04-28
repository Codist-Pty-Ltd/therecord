import Link from "next/link";

import type { AdhocCommitteeSummary } from "@the-record/shared-types";

import { COMMISSION_DOMAIN_LABELS } from "@/lib/commissions";

export default function AdhocRelatedCommittees({
  currentSlug,
  committees,
}: {
  currentSlug: string;
  committees: AdhocCommitteeSummary[];
}) {
  const rest = committees.filter((c) => c.slug !== currentSlug).slice(0, 3);
  if (rest.length === 0) return null;

  return (
    <section
      aria-label="Other ad hoc committees in this domain"
      className="border-t border-charcoal/10 py-8 md:py-10"
    >
      <h2 className="label-smallcaps text-charcoal/55 mb-4 md:mb-5">
        Other committees in this domain
      </h2>
      <ul className="flex flex-col gap-3">
        {rest.map((c) => (
          <li key={c.id}>
            <Link
              href={`/adhoc-committees/${c.slug}`}
              className="group flex flex-wrap items-baseline gap-x-3 gap-y-1 font-sans text-sm md:text-base text-charcoal/80 hover:text-amber focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/40 rounded"
            >
              <span className="font-serif text-base md:text-lg group-hover:underline decoration-amber/30 underline-offset-4">
                {c.popular_name}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-charcoal/40">
                {COMMISSION_DOMAIN_LABELS[c.domain]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
