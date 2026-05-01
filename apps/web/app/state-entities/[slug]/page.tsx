import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import SectorImpactStrip from "@/components/Impact/SectorImpactStrip";
import SoeHealthScoreBar from "@/components/StateEntities/SoeHealthScoreBar";
import StateEntityTimelineAdapter from "@/components/StateEntities/StateEntityTimelineAdapter";
import { getStateEntity } from "@/lib/api";
import { formatRands } from "@/lib/format";

import type {
  ImpactSeverity,
  StateEntityAccountabilityLink,
  StateEntityDetailResponse,
  StoryImpactSector,
} from "@the-record/shared-types";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const soe = await getStateEntity(slug);
  if (!soe) {
    return { title: "State entity not found" };
  }
  const title = `${soe.popular_name} — State-owned entity`;
  const description = `${soe.popular_name} (${soe.name}). ${soe.purpose_plain_english.slice(0, 155)}${soe.purpose_plain_english.length > 155 ? "…" : ""}`;
  return {
    title,
    description,
    openGraph: { title: `${title} | The Record`, description, type: "article", siteName: "The Record" },
  };
}

function parsePrivatisationDebate(text: string): { forText: string; againstText: string } {
  const againstIdx = text.search(/\bAGAINST\s*privatisation\s*:/i);
  if (againstIdx === -1) {
    return { forText: text.trim(), againstText: "" };
  }
  const forPart = text.slice(0, againstIdx).replace(/^\s*FOR\s*privatisation\s*:/i, "").trim();
  const againstPart = text.slice(againstIdx).replace(/^\s*AGAINST\s*privatisation\s*:/i, "").trim();
  return { forText: forPart || text.trim(), againstText: againstPart };
}

function statusChipClasses(soe: StateEntityDetailResponse): string {
  if (soe.is_in_crisis) {
    return "border-charge-red/45 bg-charge-red/10 text-charge-red";
  }
  if (soe.status === "operational") {
    return "border-timeline-green/45 bg-timeline-green/10 text-timeline-green";
  }
  if (soe.status === "restructuring" || soe.status === "business_rescue") {
    return "border-amber/45 bg-amber/12 text-amber";
  }
  return "border-charcoal/20 bg-charcoal/5 text-charcoal/80";
}

function statusLabel(soe: StateEntityDetailResponse): string {
  if (soe.is_in_crisis) return "In crisis";
  return soe.status.replace(/_/g, " ");
}

function relationshipLabel(t: string): string {
  return t.replace(/_/g, " ");
}

function accountabilityHref(link: StateEntityAccountabilityLink): string | null {
  if (link.commission) return `/commissions/${link.commission.slug}`;
  if (link.adhoc_committee) return `/adhoc-committees/${link.adhoc_committee.slug}`;
  if (link.siu_proclamation) return `/siu/proclamations/${link.siu_proclamation.slug}`;
  if (link.accountability_body) return `/accountability-bodies/${link.accountability_body.slug}`;
  return null;
}

function accountabilityTitle(link: StateEntityAccountabilityLink): string {
  if (link.commission) return link.commission.popular_name;
  if (link.adhoc_committee) return link.adhoc_committee.popular_name;
  if (link.siu_proclamation) return link.siu_proclamation.title;
  if (link.accountability_body) return link.accountability_body.name;
  return "Accountability body";
}

function buildImpactStripLinks(soe: StateEntityDetailResponse): StoryImpactSector[] {
  return soe.linked_impact_sectors.map((s, idx) => {
    const severity: ImpactSeverity = idx === 0 ? "critical" : "high";
    return {
      id: `${soe.slug}-synthetic-impact-${s.slug}`,
      story_id: soe.id,
      sector_id: s.id,
      sector: s,
      impact_chain: [],
      impact_severity: severity,
      amount_diverted_rands: null,
      people_affected_estimate: null,
      plain_english_impact: s.plain_english_child ?? s.stat_headline ?? s.ground_reality?.slice(0, 200) ?? null,
      created_at: soe.created_at,
    };
  });
}

export default async function StateEntityDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const soe = await getStateEntity(slug);
  if (!soe) notFound();

  const stripLinks = buildImpactStripLinks(soe);
  const realityText = soe.crisis_summary?.trim() || soe.health_score_rationale?.trim() || "—";
  const healthTint =
    soe.health_score == null
      ? "border-charcoal/15"
      : soe.health_score >= 70
        ? "border-timeline-green/40"
        : soe.health_score >= 40
          ? "border-amber/40"
          : "border-charge-red/40";

  const privatisation = soe.privatisation_debate ? parsePrivatisationDebate(soe.privatisation_debate) : null;

  return (
    <main className="min-h-screen bg-cream pt-[calc(4rem+1px)] md:pt-[calc(4rem+2px)]">
      <article className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
        <nav className="font-mono text-[11px] uppercase tracking-wider text-charcoal/45">
          <Link href="/state-entities" className="text-legal-blue hover:underline">
            State entities
          </Link>
          <span className="mx-2 opacity-50">/</span>
          <span className="text-charcoal/70">{soe.popular_name}</span>
        </nav>

        <header className="mt-6">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                "rounded border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider",
                statusChipClasses(soe),
              ].join(" ")}
            >
              {statusLabel(soe)}
            </span>
            <span className="rounded border border-charcoal/15 bg-charcoal/[0.04] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-charcoal/70">
              {soe.sector.replace(/_/g, " ")}
            </span>
            <span className="rounded border border-charcoal/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-charcoal/60">
              {soe.privatisation_status.replace(/_/g, " ")}
            </span>
          </div>
          <h1 className="mt-4 font-serif text-[28px] leading-[1.08] tracking-[-0.02em] text-charcoal md:text-[32px]">
            {soe.popular_name}
          </h1>
          <p className="mt-2 font-serif text-base italic text-charcoal/60 md:text-[17px]">{soe.name}</p>
          <p className="mt-4 text-sm text-charcoal/70">
            Established <span className="tabular-nums">{soe.established_year}</span>
            <span className="mx-2 text-charcoal/30">·</span>
            Supervising ministry: {soe.supervising_ministry}
          </p>
          <SoeHealthScoreBar score={soe.health_score} className="mt-8 max-w-xl" />
        </header>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-amber/30 bg-cream p-5 md:p-6">
            <p className="label-smallcaps text-amber/90">Plain English</p>
            <h2 className="mt-2 font-serif text-xl text-charcoal">What it does</h2>
            <p className="mt-4 font-serif text-base leading-relaxed text-charcoal md:text-[17px]">
              {soe.purpose_plain_english}
            </p>
          </div>
          <div className="rounded-2xl border border-legal-blue/25 bg-white p-5 md:p-6">
            <p className="label-smallcaps text-legal-blue/90">Why it matters</p>
            <h2 className="mt-2 font-serif text-xl text-charcoal">Ordinary people</h2>
            <p className="mt-4 text-base leading-relaxed text-charcoal/85 md:text-[17px]">
              {soe.why_it_matters_to_ordinary_people}
            </p>
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-charcoal/10 bg-cream/90 p-5 md:p-8" aria-label="Financial snapshot">
          <h2 className="label-smallcaps text-charcoal/50">Financial snapshot</h2>
          {soe.is_in_crisis ? (
            <div className="mt-4 rounded-xl border border-charge-red/35 bg-charge-red/10 px-4 py-3 text-sm text-charge-red">
              <strong className="font-semibold">Currently in crisis</strong>
              {soe.crisis_summary ? (
                <p className="mt-2 text-charcoal leading-relaxed">{soe.crisis_summary}</p>
              ) : null}
            </div>
          ) : null}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <FinancialCell label="Latest annual loss" value={formatRands(soe.latest_annual_loss_rands)} />
            <FinancialCell label="Financial health" value={soe.financial_health.replace(/_/g, " ")} />
            <FinancialCell label="Total bailouts (tracked)" value={formatRands(soe.total_bailouts_received_rands)} />
            <FinancialCell label="Total debt" value={formatRands(soe.total_debt_rands)} />
          </div>
        </section>

        <section className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border-2 border-constitutional-gold/50 bg-constitutional-gold/[0.04] p-5 md:p-6">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-constitutional-gold">
              Original mandate
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-charcoal/90 md:text-[15px]">{soe.purpose_original}</p>
          </div>
          <div
            className={[
              "rounded-2xl border-2 bg-cream/90 p-5 md:p-6",
              healthTint,
            ].join(" ")}
          >
            <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-charcoal/55">
              Current reality
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-charcoal/90 md:text-[15px]">{realityText}</p>
          </div>
        </section>

        {soe.timeline.length > 0 ? (
          <section className="mt-14 md:mt-16" aria-label="Timeline">
            <h2 className="label-smallcaps text-charcoal/55 mb-6">Timeline</h2>
            <StateEntityTimelineAdapter events={soe.timeline} stateEntitySlug={soe.slug} />
          </section>
        ) : null}

        {soe.accountability_links.length > 0 ? (
          <section className="mt-14 border-t border-charcoal/10 pt-12" aria-label="Accountability">
            <h2 className="label-smallcaps text-charcoal/55">This entity was investigated by</h2>
            <ul className="mt-6 space-y-4">
              {soe.accountability_links.map((link) => {
                const href = accountabilityHref(link);
                const title = accountabilityTitle(link);
                const inner = (
                  <>
                    <span className="font-serif text-[17px] text-charcoal">{title}</span>
                    <span className="mt-2 inline-block rounded border border-charcoal/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-charcoal/65">
                      {relationshipLabel(link.relationship_type)}
                    </span>
                    {link.summary ? (
                      <p className="mt-2 text-sm leading-relaxed text-charcoal/70">{link.summary}</p>
                    ) : null}
                  </>
                );
                return (
                  <li key={link.id}>
                    {href ? (
                      <Link href={href} className="block rounded-xl border border-charcoal/10 bg-cream/80 p-4 transition hover:border-amber/40">
                        {inner}
                      </Link>
                    ) : (
                      <div className="rounded-xl border border-charcoal/10 bg-cream/80 p-4">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {soe.linked_stories.length > 0 ? (
          <section className="mt-12 border-t border-charcoal/10 pt-12" aria-label="Linked stories">
            <h2 className="label-smallcaps text-charcoal/55">On The Record</h2>
            <ul className="mt-5 space-y-3">
              {soe.linked_stories.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/story/${s.slug}`}
                    className="group flex flex-col rounded-xl border border-charcoal/10 bg-cream/80 px-4 py-3 transition hover:border-amber/35 md:flex-row md:items-center md:justify-between"
                  >
                    <span className="font-serif text-[17px] text-charcoal group-hover:text-legal-blue">
                      {s.title}
                    </span>
                    <span className="mt-1 font-mono text-[10px] uppercase tracking-wider text-charcoal/45 md:mt-0">
                      {s.domain.replace(/_/g, " ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {privatisation && (privatisation.forText || privatisation.againstText) ? (
          <section className="mt-14 border-t border-charcoal/10 pt-12" aria-label="Privatisation debate">
            <h2 className="font-serif text-2xl text-charcoal">Privatisation debate</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border-2 border-amber/40 bg-amber/[0.03] p-5">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber">Arguments noted (for)</h3>
                <p className="mt-3 text-sm leading-relaxed text-charcoal/85 whitespace-pre-wrap">
                  {privatisation.forText}
                </p>
              </div>
              <div className="rounded-2xl border-2 border-legal-blue/45 bg-legal-blue/[0.04] p-5">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-legal-blue">
                  Arguments noted (against)
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-charcoal/85 whitespace-pre-wrap">
                  {privatisation.againstText || "—"}
                </p>
              </div>
            </div>
            <p className="mt-6 text-center font-serif text-sm italic text-charcoal/55">
              Editorial note: The Record summarises public debate; this is not endorsement of either side.
            </p>
          </section>
        ) : null}

        {stripLinks.length > 0 ? (
          <section className="mt-4" aria-label="Impact on people">
            <h2 className="label-smallcaps text-charcoal/55 mb-2">What this means for people</h2>
            <p className="mb-4 text-sm text-charcoal/65">
              Jump to the human-impact lens for{" "}
              <Link
                href={`/impact#sector-${soe.primary_impact_sector_slug}`}
                className="text-legal-blue underline-offset-2 hover:underline"
              >
                {soe.primary_impact_sector_slug.replace(/_/g, " ")}
              </Link>{" "}
              and related sectors.
            </p>
            <SectorImpactStrip links={stripLinks} />
          </section>
        ) : (
          <section className="mt-12 text-sm text-charcoal/65">
            <Link href={`/impact#sector-${soe.primary_impact_sector_slug}`} className="text-legal-blue hover:underline">
              View human-impact sector: {soe.primary_impact_sector_slug.replace(/_/g, " ")} →
            </Link>
          </section>
        )}
      </article>
    </main>
  );
}

function FinancialCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-charcoal/10 bg-cream p-4">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-charcoal/45">{label}</p>
      <p className="mt-2 font-serif text-lg text-charcoal">{value}</p>
    </div>
  );
}
