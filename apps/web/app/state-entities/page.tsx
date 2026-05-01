import type { Metadata } from "next";
import Link from "next/link";

import SoeCard from "@/components/StateEntities/SoeCard";
import { getStateEntitiesStats, listStateEntities } from "@/lib/api";

import type { StateEntitySector } from "@the-record/shared-types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "State-owned entities",
    description:
      "South Africa's major SOEs — health scores, bailouts, crises, and how failures hit ordinary people.",
    openGraph: {
      title: "State-owned entities | The Record",
      description:
        "Built to serve everyone. What happened to Eskom, PRASA, Transnet, and the rest?",
      type: "website",
      siteName: "The Record",
    },
  };
}

function sectorLabel(sector: StateEntitySector): string {
  return sector.replace(/_/g, " ");
}

export default async function StateEntitiesIndexPage() {
  const [list, stats] = await Promise.all([listStateEntities(1, 50), getStateEntitiesStats()]);

  const rows = list?.data ?? [];
  const totalB = stats ? stats.total_bailouts_rands / 1_000_000_000 : 0;
  const irrB = stats ? stats.irregular_expenditure_highlight_rands / 1_000_000_000 : 57;

  return (
    <main className="min-h-screen bg-cream pt-[calc(4rem+1px)] md:pt-[calc(4rem+2px)]">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
        <header className="max-w-3xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-amber">
            STATE-OWNED ENTITIES · SINCE 1994
          </p>
          <h1 className="mt-3 font-serif text-[28px] leading-[1.08] tracking-[-0.02em] text-charcoal md:text-[32px]">
            Built to serve everyone.
            <br />
            What happened?
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-charcoal/75 md:text-[17px]">
            South Africa&apos;s state entities were designed to power the economy, connect
            communities, and serve the public — especially those the market would ignore.
          </p>
        </header>

        <section
          aria-label="National SOE health scorecard"
          className="mt-10 rounded-2xl border border-charcoal/10 bg-cream/90 p-5 shadow-sm md:mt-12 md:p-8"
        >
          <h2 className="label-smallcaps text-charcoal/50">National SOE health scorecard</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ScorecardStat
              label="Total bailouts"
              value={`R${totalB >= 100 ? Math.round(totalB) : totalB.toFixed(1)}bn`}
              hint="sum of disclosed taxpayer support / relief where seeded"
            />
            <ScorecardStat
              label="In crisis"
              value={stats ? `${stats.in_crisis} of ${stats.total_entities}` : "—"}
              hint="entities flagged editorially"
            />
            <ScorecardStat
              label="Average health score"
              value={stats?.average_health_score != null ? `${stats.average_health_score}/100` : "—"}
              hint="among scored entities only"
            />
            <ScorecardStat
              label="Irregular expenditure"
              value={`R${irrB % 1 === 0 ? irrB : irrB.toFixed(0)}bn`}
              hint="Transnet + Eskom–class AG headline aggregate (editorial)"
            />
          </div>
        </section>

        <section className="mt-12 md:mt-16" aria-label="State entity profiles">
          <h2 className="label-smallcaps text-charcoal/50">Profiles</h2>
          {rows.length === 0 ? (
            <p className="mt-6 text-charcoal/65">
              No state entities in the database yet. Run{" "}
              <code className="rounded bg-charcoal/5 px-1 font-mono text-xs">seed:state-entities</code>{" "}
              on the API.
            </p>
          ) : (
            <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((soe) => (
                <li key={soe.slug}>
                  <SoeCard soe={soe} sectorLabel={sectorLabel(soe.sector)} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-14 border-t border-charcoal/10 pt-12 md:mt-16 md:pt-14">
          <h2 className="font-serif text-2xl text-charcoal">The privatisation question</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border-2 border-amber/40 bg-amber/[0.03] p-5 md:p-6">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber">
                The case for state ownership
              </h3>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-charcoal/85">
                <li>
                  Public goods (electricity, water, rail) must reach communities that markets ignore.
                </li>
                <li>
                  Cross-subsidisation: profitable routes and tariffs can fund loss-making but vital
                  services.
                </li>
                <li>Democratic accountability: public entities are meant to serve a mandate, not a dividend.</li>
                <li>
                  When Eskom shed jobs to become more &ldquo;commercial&rdquo;, millions were cut off for
                  arrears they could not pay.
                </li>
                <li>Nelspruit water privatisation saw rates surge — a cautionary comparator in debates.</li>
                <li>
                  &ldquo;Backdoor privatisation&rdquo; at Eskom-style utilities can shift profit private-ward
                  while risk stays public.
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-legal-blue/45 bg-legal-blue/[0.04] p-5 md:p-6">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-legal-blue">
                The case for private management
              </h3>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-charcoal/85">
                <li>State corruption and cadre deployment have destroyed capacity at several SOEs.</li>
                <li>
                  Eskom-scale debt relief shows how taxpayers can be left funding institutional failure.
                </li>
                <li>Private IPPs were part of the mix that helped end the worst load-shedding.</li>
                <li>Competition can drive efficiency — when markets are genuinely contestable.</li>
                <li>SAA-style losses show airlines can exist without an eternal sovereign chequebook.</li>
              </ul>
            </div>
          </div>
          <p className="mt-8 text-center font-serif text-sm italic text-amber md:text-base">
            The Record does not take a position on privatisation. We present both arguments because the
            answer affects every South African differently.
          </p>
        </section>

        <p className="mt-12 text-center text-sm text-charcoal/50">
          <Link href="/impact" className="text-legal-blue underline-offset-2 hover:underline">
            Explore human-impact sectors
          </Link>
        </p>
      </div>
    </main>
  );
}

function ScorecardStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-charcoal/10 bg-cream p-4">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-charcoal/45">{label}</p>
      <p className="mt-2 font-serif text-2xl tabular-nums text-charcoal md:text-[26px]">{value}</p>
      <p className="mt-2 text-xs leading-snug text-charcoal/50">{hint}</p>
    </div>
  );
}
