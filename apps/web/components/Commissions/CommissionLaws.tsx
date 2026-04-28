/**
 * CommissionLaws — grouped view of every law section linked to a commission,
 * bucketed by usage_type. Renders one sub-section per non-empty bucket.
 *
 * Server Component.
 */

import type {
  CommissionLawSectionBrief,
  CommissionLawSectionUsage,
  LawSectionsByUsage,
} from "@the-record/shared-types";

import { COMMISSION_LAW_USAGE_LABELS } from "@/lib/commissions";

interface CommissionLawsProps {
  lawSections: LawSectionsByUsage;
}

const USAGE_ORDER: CommissionLawSectionUsage[] = [
  "enabling",
  "investigated",
  "violated",
  "recommended",
];

const USAGE_BORDERS: Record<CommissionLawSectionUsage, string> = {
  enabling: "border-legal-blue",
  investigated: "border-amber",
  violated: "border-charge-red",
  recommended: "border-constitutional-gold",
};

const USAGE_TEXT: Record<CommissionLawSectionUsage, string> = {
  enabling: "text-legal-blue",
  investigated: "text-amber",
  violated: "text-charge-red",
  recommended: "text-constitutional-gold",
};

export default function CommissionLaws({ lawSections }: CommissionLawsProps) {
  const total =
    lawSections.enabling.length +
    lawSections.investigated.length +
    lawSections.violated.length +
    lawSections.recommended.length;

  if (total === 0) return null;

  return (
    <section
      aria-labelledby="commission-laws-heading"
      className="border-t border-charcoal/10 py-8 md:py-12 flex flex-col gap-7 md:gap-10"
    >
      <div>
        <p className="label-smallcaps text-amber mb-2">Legal framework</p>
        <h2
          id="commission-laws-heading"
          className="font-serif text-[24px] md:text-3xl lg:text-[36px] leading-tight text-charcoal max-w-3xl"
        >
          Every law in play.
        </h2>
      </div>

      <div className="flex flex-col gap-7 md:gap-10">
        {USAGE_ORDER.map((usage) => {
          const bucket = lawSections[usage];
          if (bucket.length === 0) return null;
          return (
            <UsageGroup
              key={usage}
              usage={usage}
              sections={bucket}
            />
          );
        })}
      </div>
    </section>
  );
}

// =============================================================================
// Group
// =============================================================================

function UsageGroup({
  usage,
  sections,
}: {
  usage: CommissionLawSectionUsage;
  sections: CommissionLawSectionBrief[];
}) {
  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <h3
        className={[
          "font-serif text-[18px] md:text-[22px] leading-snug",
          "pl-4 border-l-4",
          USAGE_BORDERS[usage],
          USAGE_TEXT[usage],
        ].join(" ")}
      >
        {COMMISSION_LAW_USAGE_LABELS[usage]}
      </h3>

      <ul className="flex flex-col gap-3 md:gap-4">
        {sections.map((s) => (
          <li
            key={s.id}
            className="bg-white border border-charcoal/10 rounded-xl p-4 md:p-5 flex flex-col gap-2"
          >
            <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.14em] text-charcoal/55">
              {s.law_short_name} · Section {s.section_number}
            </span>
            <span className="font-serif text-[16px] md:text-lg leading-snug text-charcoal">
              {s.section_title}
            </span>
            {s.plain_english ? (
              <span className="font-sans text-[13px] md:text-sm text-charcoal/70 leading-relaxed">
                {s.plain_english}
              </span>
            ) : null}
            <span className="font-sans text-[11px] md:text-xs text-charcoal/50 italic">
              {s.law_name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
