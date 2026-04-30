import Link from "next/link";

import { bodyStatusChipClasses } from "@/lib/accountability-bodies-display";
import type { CommissionDetail } from "@the-record/shared-types";

interface CommissionSubjectBodyProps {
  commission: CommissionDetail;
}

/**
 * When a commission investigated an accountability body (e.g. Khampepe → Scorpions),
 * surfaces the full narrative chain on the commission detail page.
 */
export default function CommissionSubjectBody({ commission }: CommissionSubjectBodyProps) {
  const body = commission.subject_body;
  if (!body) return null;

  const st = bodyStatusChipClasses(body.status);

  return (
    <section className="mt-12 md:mt-16 rounded-2xl border border-legal-blue/25 bg-legal-blue/[0.06] p-6 md:p-8">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-legal-blue/80">
        Subject of this Commission
      </h2>
      <p className="mt-4 text-lg text-charcoal leading-relaxed">
        This commission investigated:{" "}
        <span className="font-serif text-xl">{body.popular_name}</span>
        <span className="ml-2 align-middle">
          <span
            className={[
              "inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider",
              st.wrap,
            ].join(" ")}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
            {st.label}
          </span>
        </span>
      </p>

      <div className="mt-6 space-y-4 text-sm leading-relaxed text-charcoal/85">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-charcoal/45 mb-1">
            What the unit was for
          </p>
          <p>{body.mandate_summary}</p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-charcoal/45 mb-1">
            What the commission found
          </p>
          <p>
            {commission.outcome_summary?.trim() ??
              "Outcome summary is not yet recorded on The Record for this commission."}
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-charcoal/45 mb-1">
            What actually happened
          </p>
          <p>
            {body.legacy_summary?.trim() ??
              "See the unit’s full profile for how executive decisions diverged from the commission’s recommendation."}
          </p>
        </div>
      </div>

      <p className="mt-8">
        <Link
          href={`/accountability-bodies/${body.slug}`}
          className="inline-flex items-center gap-2 font-mono text-[13px] text-legal-blue hover:text-amber transition-colors"
        >
          → Full profile: {body.popular_name}
          <span className="text-charcoal/40">({body.abbreviation})</span>
        </Link>
      </p>

      <p className="mt-6 text-xs text-charcoal/55 italic leading-relaxed border-t border-charcoal/10 pt-4">
        Editorial note: compare what {commission.popular_name} formally found with what
        happened to {body.popular_name} afterward — the divergence is often the most
        important part of the record.
      </p>
    </section>
  );
}
