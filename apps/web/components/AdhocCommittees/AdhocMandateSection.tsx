import type { AdhocCommitteeDetail } from "@the-record/shared-types";

export default function AdhocMandateSection({
  committee,
}: {
  committee: AdhocCommitteeDetail;
}) {
  if (!committee.mandate_summary?.trim()) return null;

  return (
    <section
      aria-labelledby="adhoc-mandate-heading"
      className="border-t border-charcoal/10 py-6 md:py-8"
    >
      <h2
        id="adhoc-mandate-heading"
        className="font-serif text-[18px] md:text-xl text-charcoal mb-3 md:mb-4"
      >
        Mandate
      </h2>
      <div className="pl-4 border-l-2 border-amber/80">
        <p className="font-sans text-base md:text-[17px] leading-relaxed text-charcoal/85 max-w-3xl">
          {committee.mandate_summary}
        </p>
      </div>
    </section>
  );
}
