import type { Metadata } from "next";
import Link from "next/link";

import ImpactInterconnectChains from "@/components/Impact/ImpactInterconnectChains";
import ImpactNationalStats from "@/components/Impact/ImpactNationalStats";
import ImpactSpiderWeb from "@/components/Impact/ImpactSpiderWeb";
import MoneyCalculator from "@/components/Impact/MoneyCalculator";
import PlainEnglishBox from "@/components/ui/PlainEnglishBox";
import { getImpactSectorDetail, getImpactWeb, listImpactSectors } from "@/lib/api";
import { computeMoneyToReality } from "@/lib/money-to-reality";
import { formatRands } from "@/lib/format";
import { IMPACT_SEVERITY_RANK } from "@/lib/impact-display";

import type { ImpactSectorDetail, NationalStats } from "@the-record/shared-types";

export const dynamic = "force-dynamic";

const FALLBACK_NATIONAL: NationalStats = {
  poverty_headcount: 23_200_000,
  unemployment_expanded: 42.4,
  housing_backlog: 2_400_000,
  without_water: 8_500_000,
  water_loss_rands_annual: 19_000_000_000,
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "The Real Cost | The Record",
    description:
      "How government corruption and failed accountability directly affects ordinary South African lives — housing, water, health, education, jobs and safety.",
    openGraph: {
      title: "The Real Cost | The Record",
      description:
        "How government corruption and failed accountability directly affects ordinary South African lives.",
      type: "website",
      siteName: "The Record",
    },
  };
}

function pickImpactChain(detail: ImpactSectorDetail): string[] {
  const sorted = [...detail.linked_stories].sort(
    (a, b) =>
      IMPACT_SEVERITY_RANK[a.impact_severity] - IMPACT_SEVERITY_RANK[b.impact_severity],
  );
  for (const s of sorted) {
    if (s.impact_chain.length > 0) return s.impact_chain;
  }
  return [];
}

function RealityPills({ amountRands }: { amountRands: number }) {
  const m = computeMoneyToReality(amountRands);
  if (amountRands <= 0) return null;
  const items: { n: number; label: string }[] = [
    { n: m.rdp_houses, label: "RDP houses (±R250k each)" },
    { n: m.child_support_grants, label: "Child Support Grant-years" },
    { n: m.school_repairs, label: "school repairs at R5m" },
    { n: m.water_connections, label: "water connections at R50k" },
    { n: m.hospital_beds, label: "ICU beds at R1m" },
    { n: m.teachers_per_year, label: "teacher salary-years at R300k" },
  ].filter((x) => x.n > 0);

  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {items.map((it, idx) => (
        <li
          key={`${idx}-${it.label}`}
          className="rounded-full border border-amber/35 bg-amber/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-charcoal"
        >
          {it.n.toLocaleString("en-ZA")} {it.label}
        </li>
      ))}
    </ul>
  );
}

export default async function ImpactPage({
  searchParams,
}: {
  searchParams: Promise<{ amount?: string; story?: string }>;
}) {
  const sp = await searchParams;
  const initialAmount = sp.amount ? Number.parseInt(sp.amount, 10) : undefined;
  const initialStory = sp.story;

  const [web, sectorList] = await Promise.all([getImpactWeb(), listImpactSectors()]);

  const slugs =
    sectorList.length > 0
      ? [...sectorList].sort((a, b) => a.slug.localeCompare(b.slug)).map((s) => s.slug)
      : (web?.sectors ?? []).map((s) => s.slug).sort();

  const detailRows = await Promise.all(slugs.map((slug) => getImpactSectorDetail(slug)));
  const details = detailRows.filter((d): d is ImpactSectorDetail => d != null);

  const national = web?.national_stats ?? FALLBACK_NATIONAL;

  return (
    <div className="bg-cream text-charcoal">
      <section className="bg-charcoal text-cream">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-12 md:px-8 md:pb-14 md:pt-16">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-amber">
            THE HUMAN COST
          </p>
          <h1 className="mt-5 max-w-xl font-serif text-[32px] leading-[1.12] md:text-[40px]">
            This is not about politicians.
            <span className="block">This is about you.</span>
          </h1>
          <p className="mt-5 max-w-xl font-sans text-sm leading-relaxed text-cream/[0.7]">
            Every commission. Every tender fraud. Every stolen rand. Here is what it actually
            means for ordinary South African lives.
          </p>
        </div>
      </section>

      <ImpactNationalStats stats={national} />

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:gap-12 lg:items-start">
          <div>
            <h2 className="font-serif text-[22px] text-charcoal md:text-[26px]">
              How the threads connect
            </h2>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-charcoal/65">
              Tap a lens to jump to the constitutional right, the data, and the stories we are
              tracking. Cross-lines show where the same investigation touches more than one part
              of daily life.
            </p>
            {web ? (
              <div className="mt-8 flex justify-center lg:justify-start">
                <ImpactSpiderWeb sectors={web.sectors} connections={web.connections} />
              </div>
            ) : (
              <p className="mt-6 text-sm text-charcoal/55">
                The impact map could not be loaded. Sector sections below may still be available.
              </p>
            )}
          </div>
          <aside className="mt-10 lg:mt-0">
            <div className="rounded-2xl border border-charcoal/10 bg-white/60 p-5 shadow-sm md:p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber">
                Constitutional frame
              </p>
              <p className="mt-3 font-serif text-lg text-charcoal">
                Eight lenses on daily life
              </p>
              <p className="mt-2 text-sm leading-relaxed text-charcoal/65">
                Each sector below names the constitutional promise, the national statistic editors
                are watching, and{" "}
                <span className="text-legal-blue italic">the right as law describes it</span> —
                before we show what happened on the ground.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <div className="border-t border-charcoal/10 bg-white/40 py-10">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <p className="text-center font-sans text-sm leading-relaxed text-charcoal/60">
            These figures show the scale of service delivery failures. Not all are caused solely
            by corruption — but all are worsened by it.
          </p>
        </div>
      </div>

      {details.map((detail) => {
        const chain = pickImpactChain(detail);
        const topStories = detail.linked_stories.slice(0, 3);
        const money = detail.total_money_tracked_rands;

        return (
          <section
            key={detail.id}
            id={`sector-${detail.slug}`}
            className="scroll-mt-28 border-t border-charcoal/10 py-14 md:py-16"
          >
            <div className="mx-auto max-w-6xl px-4 md:px-8">
              <header className="border-b border-charcoal/10 pb-6">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-2xl" aria-hidden>
                    {detail.icon ?? "◆"}
                  </span>
                  <h2 className="font-serif text-[22px] text-charcoal md:text-[24px]">
                    {detail.name}
                  </h2>
                </div>
                {detail.constitutional_right ? (
                  <p className="mt-3 font-sans text-[13px] italic leading-relaxed text-legal-blue">
                    {detail.constitutional_right}
                  </p>
                ) : null}
                <p className="mt-3 font-sans text-sm text-charcoal/75">
                  {detail.stat_value ? (
                    <span className="font-semibold text-charcoal">{detail.stat_value}</span>
                  ) : null}{" "}
                  {detail.stat_label ? <span>{detail.stat_label}</span> : null}
                  {detail.stat_source ? (
                    <span className="text-charcoal/55">
                      {" "}
                      · Source: {detail.stat_source}
                      {detail.stat_year ? ` (${detail.stat_year})` : ""}
                    </span>
                  ) : null}
                </p>
              </header>

              <div className="mt-8 grid gap-8 md:grid-cols-2 md:gap-10">
                <div className="border-l-4 border-constitutional-gold/80 bg-cream/80 pl-4 pr-2 py-3 md:pl-5">
                  <h3 className="font-mono text-[10px] uppercase tracking-widest text-charcoal/50">
                    What was promised
                  </h3>
                  <p className="mt-3 font-sans text-sm leading-relaxed text-charcoal/85">
                    {detail.what_was_promised}
                  </p>
                </div>
                <div className="border-l-4 border-charge-red/80 bg-cream/80 pl-4 pr-2 py-3 md:pl-5">
                  <h3 className="font-mono text-[10px] uppercase tracking-widest text-charcoal/50">
                    The reality today
                  </h3>
                  <p className="mt-3 font-sans text-sm leading-relaxed text-charcoal/85">
                    {detail.ground_reality}
                  </p>
                </div>
              </div>

              <div className="mt-12">
                <h3 className="font-serif text-lg text-charcoal">
                  How stolen money reaches your life
                </h3>
                {chain.length > 0 ? (
                  <ol className="mt-5 space-y-0">
                    {chain.map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber text-xs font-bold text-cream">
                            {i + 1}
                          </span>
                          {i < chain.length - 1 ? (
                            <span className="w-px flex-1 min-h-[18px] bg-charcoal/15" aria-hidden />
                          ) : null}
                        </div>
                        <p className="pb-6 font-sans text-sm leading-relaxed text-charcoal/85">
                          {step}
                        </p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-3 text-sm text-charcoal/55">
                    No causal chain is seeded for this lens yet — browse linked stories for the
                    evolving picture.
                  </p>
                )}
              </div>

              <div className="mt-12">
                <h3 className="font-serif text-lg text-charcoal">
                  What this money should have funded
                </h3>
                <p className="mt-2 font-sans text-sm text-charcoal/65">
                  Tracked money tied to stories in this lens:{" "}
                  <span className="font-semibold text-charcoal tabular-nums">
                    {money > 0 ? formatRands(money) : "R0"}
                  </span>
                  .
                </p>
                {detail.what_it_should_have_funded_lines.length > 0 ? (
                  <ul className="mt-4 space-y-3">
                    {detail.what_it_should_have_funded_lines.map((line, li) => (
                      <li
                        key={`${detail.slug}-what-${li}`}
                        className="rounded-lg border border-charcoal/10 bg-white/70 px-3 py-2 text-sm leading-relaxed text-charcoal/80"
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <RealityPills amountRands={money} />
              </div>

              <div className="mt-10">
                <PlainEnglishBox
                  text={detail.plain_english_child}
                  level="child"
                  collapseMobileOnly
                  label="Plain English — for a child"
                />
              </div>

              <div className="mt-12">
                <h3 className="label-smallcaps text-charcoal/55">
                  Stories on The Record tracking {detail.name.toLowerCase()} corruption:
                </h3>
                {topStories.length > 0 ? (
                  <ul className="mt-4 divide-y divide-charcoal/10">
                    {topStories.map((s) => (
                      <li key={s.id}>
                        <Link
                          href={`/story/${s.slug}`}
                          className="flex min-h-[52px] flex-col justify-center py-3 transition hover:bg-amber/[0.04]"
                        >
                          <span className="font-medium text-charcoal">{s.title}</span>
                          {s.plain_english_impact ? (
                            <span className="mt-1 line-clamp-2 text-xs text-charcoal/55">
                              {s.plain_english_impact}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-charcoal/55">No linked stories yet.</p>
                )}
                {detail.story_count > 3 ? (
                  <Link
                    href="/stories"
                    className="mt-4 inline-flex font-mono text-[11px] uppercase tracking-wider text-amber"
                  >
                    See all {detail.story_count} stories →
                  </Link>
                ) : null}
              </div>
            </div>
          </section>
        );
      })}

      <ImpactInterconnectChains />

      <div className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-16">
        <MoneyCalculator initialAmountRands={initialAmount} initialStoryKey={initialStory} />
      </div>
    </div>
  );
}
