"use client";

import Link from "next/link";

import SoeHealthScoreBar from "@/components/StateEntities/SoeHealthScoreBar";

import type { StateEntityListItem, StateEntityStatus } from "@the-record/shared-types";

const CARD_COPY: Record<
  string,
  {
    keyStat: string;
    tagline: string;
  }
> = {
  eskom: { keyStat: "R254bn debt relief", tagline: "When the lights go out, everything stops" },
  prasa: { keyStat: "80%+ trains broken", tagline: "Workers pay 4× more for taxis" },
  "south-african-post-office": {
    keyStat: "R7.9bn liabilities > assets",
    tagline: "18m grant recipients lost their postal bank",
  },
  sabc: { keyStat: "R3.2bn bailouts", tagline: "For millions, the only broadcaster they can afford" },
  sassa: { keyStat: "18m grant recipients", tagline: "When grants fail, families go hungry" },
  transnet: { keyStat: "R130bn debt", tagline: "When ports and rail fail, prices rise for everyone" },
  nsfas: { keyStat: "Allowance crises", tagline: "Poor students drop out when stipends stall" },
  "south-african-airways": { keyStat: "R40bn bailouts", tagline: "Connectivity vs endless sovereign tabs" },
  "rand-water": { keyStat: "19m people supplied", tagline: "Bulk water works — municipalities leak it away" },
  denel: { keyStat: "R3.4bn debt", tagline: "Defence jobs and skills flight when SOEs collapse" },
};

function statusPresentation(
  status: StateEntityStatus,
  inCrisis: boolean,
): { label: string; className: string } {
  if (inCrisis) {
    return {
      label: "In crisis",
      className: "border-charge-red/45 bg-charge-red/10 text-charge-red",
    };
  }
  if (status === "operational") {
    return {
      label: "Operational",
      className: "border-timeline-green/45 bg-timeline-green/10 text-timeline-green",
    };
  }
  if (status === "restructuring" || status === "business_rescue") {
    return {
      label: status === "business_rescue" ? "Business rescue" : "Restructuring",
      className: "border-amber/45 bg-amber/12 text-amber",
    };
  }
  return {
    label: status.replace(/_/g, " "),
    className: "border-charcoal/20 bg-charcoal/5 text-charcoal/80",
  };
}

export default function SoeCard({
  soe,
  sectorLabel,
}: {
  soe: StateEntityListItem;
  sectorLabel: string;
}) {
  const copy = CARD_COPY[soe.slug] ?? {
    keyStat: soe.total_bailouts_received_rands
      ? `Bailouts tracked`
      : soe.latest_annual_loss_rands
        ? `Losses flagged`
        : "On the record",
    tagline: "How this entity touches ordinary lives",
  };
  const chip = statusPresentation(soe.status, soe.is_in_crisis);

  return (
    <article className="flex h-full flex-col rounded-2xl border border-charcoal/10 bg-cream p-5 shadow-sm transition hover:border-amber/35 md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={[
            "rounded border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider",
            chip.className,
          ].join(" ")}
        >
          {chip.label}
        </span>
        <span className="rounded border border-charcoal/15 bg-charcoal/[0.04] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-charcoal/70">
          {sectorLabel}
        </span>
      </div>
      <h2 className="mt-4 font-serif text-[18px] leading-tight text-charcoal">{soe.popular_name}</h2>
      <p className="mt-1 text-xs text-charcoal/50">{soe.name}</p>
      <SoeHealthScoreBar score={soe.health_score} className="mt-4" />
      <p className="mt-5 font-serif text-xl tabular-nums text-amber">{copy.keyStat}</p>
      <p className="mt-2 text-xs italic leading-relaxed text-charcoal/55">{copy.tagline}</p>
      {soe.related_story_count > 0 ? (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-charcoal/45">
          {soe.related_story_count} stor
          {soe.related_story_count === 1 ? "y" : "ies"} on The Record
        </p>
      ) : null}
      <div className="mt-auto pt-6">
        <Link
          href={`/state-entities/${soe.slug}`}
          className="inline-flex items-center font-mono text-[11px] uppercase tracking-wider text-legal-blue hover:underline"
        >
          Full profile →
        </Link>
      </div>
    </article>
  );
}
