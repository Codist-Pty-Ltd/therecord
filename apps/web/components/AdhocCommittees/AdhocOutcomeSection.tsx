import type { AdhocCommitteeDetail } from "@the-record/shared-types";

function isConcluded(c: AdhocCommitteeDetail): boolean {
  return (
    c.status === "concluded" ||
    c.status === "mandate_completed" ||
    c.status === "lapsed" ||
    Boolean(c.concluded_date)
  );
}

export default function AdhocOutcomeSection({
  committee,
}: {
  committee: AdhocCommitteeDetail;
}) {
  if (!isConcluded(committee)) return null;

  const narrative = committee.outcome_summary?.trim();
  const hasAccountabilityFlag = committee.produced_accountability_action != null;

  if (!narrative && !hasAccountabilityFlag) return null;

  return (
    <section
      aria-labelledby="adhoc-outcome-heading"
      className="border-t border-charcoal/10 py-8 md:py-12 flex flex-col gap-5 md:gap-6"
    >
      <div>
        <p className="label-smallcaps text-amber mb-2">Outcome</p>
        <h2
          id="adhoc-outcome-heading"
          className="font-serif text-[22px] md:text-3xl leading-tight text-charcoal max-w-3xl"
        >
          What happened
        </h2>
      </div>

      {narrative ? (
        <p className="font-sans text-base md:text-lg leading-relaxed text-charcoal/85 max-w-3xl">
          {narrative}
        </p>
      ) : null}

      {hasAccountabilityFlag ? (
        <AccountabilityCallout value={committee.produced_accountability_action} />
      ) : null}

      {committee.report_url ? (
        <a
          href={committee.report_url}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start inline-flex items-center gap-2 bg-charcoal text-cream rounded-full px-5 py-2.5 font-mono text-[11px] md:text-xs uppercase tracking-[0.18em] hover:bg-amber transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-amber/40"
        >
          Open official record
          <span aria-hidden>↗</span>
        </a>
      ) : null}
    </section>
  );
}

function AccountabilityCallout({ value }: { value: boolean | null }) {
  if (value === true) {
    return (
      <aside
        aria-label="Accountability result"
        className="max-w-3xl rounded-r-2xl border-l-4 border-timeline-green bg-timeline-green/15 px-6 md:px-8 py-6 md:py-8"
      >
        <p className="font-sans text-lg md:text-xl font-semibold text-charcoal">
          This committee produced accountability action
        </p>
      </aside>
    );
  }
  if (value === false) {
    return (
      <aside
        aria-label="Accountability result"
        className="max-w-3xl rounded-r-2xl border-l-4 border-charge-red bg-charge-red/12 px-6 md:px-8 py-6 md:py-8"
      >
        <p className="font-sans text-lg md:text-xl font-semibold text-charcoal">
          This committee produced no accountability action
        </p>
      </aside>
    );
  }
  return null;
}
