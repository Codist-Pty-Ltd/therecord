import type { AdhocCommitteeDetail } from "@the-record/shared-types";

import {
  ADHOC_CATEGORY_LABELS,
  adhocCategoryChipClasses,
} from "@/lib/adhoc";
import { ADHOC_CATEGORY_DETAIL } from "@/lib/adhoc-detail";

export default function AdhocCategorySection({
  committee,
}: {
  committee: AdhocCommitteeDetail;
}) {
  const chip = adhocCategoryChipClasses(committee.category);
  const detail = ADHOC_CATEGORY_DETAIL[committee.category];

  return (
    <section
      aria-label="Committee category"
      className="py-5 md:py-6 flex flex-col gap-2 md:gap-3"
    >
      <span className="label-smallcaps text-charcoal/50">Category</span>
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={[
            "inline-flex items-center px-2.5 py-0.5 rounded-full",
            "font-mono text-[10px] md:text-[11px] uppercase tracking-[0.14em] border",
            chip.bg,
            chip.text,
            chip.border,
          ].join(" ")}
        >
          {ADHOC_CATEGORY_LABELS[committee.category]}
        </span>
      </div>
      <p className="font-sans text-sm md:text-base text-charcoal/75 max-w-3xl leading-relaxed">
        {detail}
      </p>
    </section>
  );
}
