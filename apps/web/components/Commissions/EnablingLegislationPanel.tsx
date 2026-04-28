/**
 * EnablingLegislationPanel — shows the act/section under which a commission
 * was created, plus the Constitutional section that gave the President the
 * power to create it (when applicable).
 *
 * Server Component.
 */

import Link from "next/link";

import type {
  CommissionLawSectionBrief,
  CommissionDetail,
} from "@the-record/shared-types";

interface EnablingLegislationPanelProps {
  enabling_legislation: string;
  constitution_section_invoked: string;
  enabling_sections: CommissionLawSectionBrief[];
}

export default function EnablingLegislationPanel({
  enabling_legislation,
  constitution_section_invoked,
  enabling_sections,
}: EnablingLegislationPanelProps) {
  const constitutionalHref = constitutionHref(constitution_section_invoked);

  return (
    <section
      aria-label="Enabling legislation"
      className="bg-white rounded-xl md:rounded-2xl border border-charcoal/10 p-5 md:p-7 flex flex-col gap-4 md:gap-5"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <p className="label-smallcaps text-legal-blue">Created under</p>
      </div>

      <p className="font-serif text-[18px] md:text-xl lg:text-[22px] leading-[1.3] text-charcoal">
        {enabling_legislation}
      </p>

      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-charcoal/50">
          Constitutional basis
        </span>
        {constitutionalHref ? (
          <Link
            href={constitutionalHref}
            className="inline-flex items-center gap-1.5 self-start font-serif text-[16px] md:text-lg text-legal-blue hover:text-amber transition-colors underline underline-offset-4 decoration-legal-blue/30 hover:decoration-amber"
          >
            {constitution_section_invoked}
            <span aria-hidden>→</span>
          </Link>
        ) : (
          <span className="font-serif text-[16px] md:text-lg text-charcoal/75">
            {constitution_section_invoked || "—"}
          </span>
        )}
      </div>

      {enabling_sections.length > 0 ? (
        <div className="pt-4 md:pt-5 border-t border-charcoal/10 flex flex-col gap-3">
          <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-charcoal/50">
            Enabling statutory sections
          </span>
          <ul className="flex flex-col gap-3">
            {enabling_sections.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-1.5 bg-cream/70 rounded-lg px-4 py-3"
              >
                <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.14em] text-charcoal/60">
                  {s.law_short_name} · Section {s.section_number}
                </span>
                <span className="font-serif text-[15px] md:text-base leading-snug text-charcoal">
                  {s.section_title}
                </span>
                {s.plain_english ? (
                  <span className="font-sans text-[13px] md:text-sm text-charcoal/70 leading-relaxed">
                    {s.plain_english}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

/**
 * Best-effort normalisation from a free-form section string (e.g.
 * `"Section 84(2)(f)"`) to the Constitution section detail URL. We already
 * expose `/laws/constitution/:section` in the app; here we extract the
 * leading numeric section if present.
 */
function constitutionHref(section: string): string | null {
  const match = section.match(/\b(\d+)\b/);
  if (!match) return null;
  return `/laws/constitution/${match[1]}`;
}

export type { CommissionDetail };
