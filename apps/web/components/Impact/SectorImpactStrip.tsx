"use client";

import Link from "next/link";

import {
  IMPACT_SEVERITY_RANK,
  impactSeverityLabel,
} from "@/lib/impact-display";

import type { ImpactSeverity, ImpactWebSectorNode, StoryImpactSector } from "@the-record/shared-types";

function severityBadgeClass(s: ImpactSeverity): string {
  switch (s) {
    case "critical":
      return "border-charge-red/50 bg-charge-red/10 text-charge-red";
    case "high":
      return "border-amber/50 bg-amber/15 text-amber";
    case "medium":
      return "border-charcoal/20 bg-charcoal/5 text-charcoal/80";
    default:
      return "border-charcoal/15 bg-cream text-charcoal/65";
  }
}

export interface SectorImpactStripProps {
  links: StoryImpactSector[];
  /** Optional web nodes for richer labels (stat one-liners). */
  webSectors?: ImpactWebSectorNode[];
}

export default function SectorImpactStrip({ links, webSectors }: SectorImpactStripProps) {
  const sorted = [...links].sort(
    (a, b) =>
      IMPACT_SEVERITY_RANK[a.impact_severity] - IMPACT_SEVERITY_RANK[b.impact_severity],
  );

  if (sorted.length === 0) return null;

  const webBySlug = new Map((webSectors ?? []).map((s) => [s.slug, s]));

  return (
    <section
      aria-label="Who this affected"
      className="mt-10 md:mt-12 border-t border-charcoal/10 pt-10 md:pt-12"
    >
      <h2 className="label-smallcaps text-charcoal/55 mb-4">Who this affected</h2>
      <div className="-mx-4 md:mx-0">
        <ul className="flex gap-3 overflow-x-auto px-4 pb-1 md:flex-wrap md:overflow-visible md:px-0 snap-x snap-mandatory md:snap-none">
          {sorted.map((row) => {
            const sector = row.sector;
            if (!sector) return null;
            const web = webBySlug.get(sector.slug);
            const line =
              row.plain_english_impact ??
              web?.stat_label ??
              sector.stat_headline ??
              sector.ground_reality?.slice(0, 120);
            return (
              <li
                key={row.id}
                className="snap-start shrink-0 w-[min(300px,88vw)] md:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)]"
              >
                <Link
                  href={`/impact#sector-${sector.slug}`}
                  className="flex h-full flex-col rounded-2xl border border-charcoal/10 bg-cream/90 p-4 transition hover:border-amber/35 hover:bg-amber/[0.04]"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xl" aria-hidden>
                      {sector.icon ?? "◆"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-[17px] leading-tight text-charcoal">
                        {sector.name}
                      </p>
                      <span
                        className={[
                          "mt-2 inline-block rounded border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider",
                          severityBadgeClass(row.impact_severity),
                        ].join(" ")}
                      >
                        {impactSeverityLabel(row.impact_severity)}
                      </span>
                    </div>
                  </div>
                  {line ? (
                    <p className="mt-3 text-sm leading-relaxed text-charcoal/70 line-clamp-4">
                      {line}
                    </p>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
