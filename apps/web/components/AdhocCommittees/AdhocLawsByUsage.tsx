import type { AdhocCommitteeDetail } from "@the-record/shared-types";

import LegalPanel from "@/components/ui/LegalPanel";
import { ADHOC_LAW_GROUP_LABEL, mergeLawSectionsByUsage } from "@/lib/adhoc-detail";

export default function AdhocLawsByUsage({
  law_sections,
}: {
  law_sections: AdhocCommitteeDetail["law_sections"];
}) {
  const groups = mergeLawSectionsByUsage(law_sections);
  if (groups.length === 0) return null;

  return (
    <section
      aria-labelledby="adhoc-laws-heading"
      className="border-t border-charcoal/10 py-8 md:py-12 flex flex-col gap-6 md:gap-8"
    >
      <h2
        id="adhoc-laws-heading"
        className="font-serif text-[20px] md:text-2xl text-charcoal"
      >
        Linked laws
      </h2>

      <div className="flex flex-col gap-6 md:gap-8">
        {groups.map((g) => (
          <LegalPanel
            key={g.key}
            title={ADHOC_LAW_GROUP_LABEL[g.key] ?? g.key}
            references={g.refs}
            variant="statutory"
          />
        ))}
      </div>
    </section>
  );
}
