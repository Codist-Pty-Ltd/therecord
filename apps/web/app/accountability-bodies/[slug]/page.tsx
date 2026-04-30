import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import AccountabilityBodyMergedTimeline from "@/components/AccountabilityBodies/AccountabilityBodyMergedTimeline";
import HighProfileCasesSection from "@/components/AccountabilityBodies/HighProfileCasesSection";
import SimilarStoriesStrip from "@/components/Story/SimilarStoriesStrip";
import PlainEnglishBox from "@/components/ui/PlainEnglishBox";
import {
  bodyStatusChipClasses,
  convictionRateDisplay,
  formatBodyYearsActive,
  parseNumberedEvidence,
} from "@/lib/accountability-bodies-display";
import {
  getAccountabilityBody,
  getAccountabilityBodyCases,
  getAccountabilityBodyTimeline,
} from "@/lib/api";
import { formatRandsCompact } from "@/lib/format";

import type { SimilarStoryBrief } from "@the-record/shared-types";

export const dynamic = "force-dynamic";

interface Params {
  slug: string;
}

interface PageProps {
  params: Promise<Params>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const body = await getAccountabilityBody(slug);
  if (!body) {
    return {
      title: "Accountability body — The Record",
      robots: { index: false, follow: false },
    };
  }
  const title = `${body.popular_name} (${body.abbreviation}) | The Record`;
  const raw = body.mandate_summary?.trim() ?? "";
  const description =
    raw.length > 160 ? `${raw.slice(0, 157)}…` : raw || `Profile: ${body.popular_name}.`;
  return {
    title,
    description,
    openGraph: { title, description, siteName: "The Record", locale: "en_ZA", type: "article" },
  };
}

export default async function AccountabilityBodyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [body, casesRes, timelineRes] = await Promise.all([
    getAccountabilityBody(slug),
    getAccountabilityBodyCases(slug),
    getAccountabilityBodyTimeline(slug),
  ]);

  if (!body) {
    notFound();
  }

  const cases = casesRes?.data?.length ? casesRes.data : body.cases;
  const events = timelineRes?.events ?? [];
  const st = bodyStatusChipClasses(body.status);
  const rate = convictionRateDisplay(body.conviction_rate_percentage);

  const storySlugById = Object.fromEntries(
    body.linked_stories.map((s) => [s.id, s.slug] as const),
  );

  const similarBriefs: SimilarStoryBrief[] = body.linked_stories.map((s) => ({
    title: s.title,
    slug: s.slug,
    match_type: "explicit_table",
  }));

  const opStart = body.operational_date ?? body.established_date;
  const opEnd = body.disbanded_date;
  const yearsLabel = formatBodyYearsActive(body);

  const evidencePoints =
    body.political_disbanding_evidence != null
      ? parseNumberedEvidence(body.political_disbanding_evidence)
      : [];

  return (
    <article className="bg-cream min-w-0">
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-10 md:pt-14 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={[
              "inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider",
              st.wrap,
            ].join(" ")}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
            {st.label}
          </span>
        </div>

        <h1 className="mt-5 font-serif text-[32px] md:text-[40px] text-charcoal tracking-tight leading-tight">
          {body.popular_name}
        </h1>
        <p className="mt-2 font-sans text-base italic text-charcoal/60">{body.name}</p>
        <span className="mt-3 inline-block rounded border border-amber/35 bg-amber/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-amber">
          {body.abbreviation}
        </span>

        {body.status === "disbanded" ? (
          <div className="mt-8 rounded-xl border-l-4 border-charge-red bg-charge-red/[0.06] p-5 md:p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-charge-red">
              Disbanded
            </p>
            <p className="mt-2 text-sm text-charcoal/85">
              <span className="font-medium">Operational:</span>{" "}
              {opStart ? opStart : "—"}
              {opEnd ? ` · Disbanded: ${opEnd}` : null}
            </p>
            {body.replaced_by ? (
              <p className="mt-2 text-sm text-charcoal/80">
                <span className="font-medium">Replaced by:</span> {body.replaced_by}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 py-8 border-y border-charcoal/10">
          <div>
            <p className="font-serif text-3xl md:text-4xl text-amber tabular-nums">
              {rate ?? "—"}
            </p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-charcoal/45">
              Conviction rate
            </p>
          </div>
          <div>
            <p className="font-serif text-3xl md:text-4xl text-amber tabular-nums">
              {body.total_convictions != null
                ? body.total_convictions.toLocaleString("en-ZA")
                : "—"}
            </p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-charcoal/45">
              Convictions
            </p>
          </div>
          <div>
            <p className="font-serif text-3xl md:text-4xl text-amber tabular-nums">
              {body.total_investigations != null
                ? body.total_investigations.toLocaleString("en-ZA")
                : "—"}
            </p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-charcoal/45">
              Investigations
            </p>
          </div>
          <div>
            <p className="font-serif text-2xl md:text-3xl text-amber tabular-nums leading-tight">
              {formatRandsCompact(body.assets_seized_rands)}
            </p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-charcoal/45">
              Assets seized
            </p>
          </div>
        </div>

        {body.status === "disbanded" && body.cases_transferred_on_dissolution != null ? (
          <div className="py-6 border-b border-charcoal/10">
            <p className="font-serif text-xl text-charcoal tabular-nums">
              {body.cases_transferred_on_dissolution.toLocaleString("en-ZA")}
            </p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-charcoal/45">
              Cases transferred at dissolution
            </p>
            <p className="mt-2 text-sm text-charge-red font-medium">
              See: What happened to these cases?
            </p>
          </div>
        ) : null}

        <section className="py-10 space-y-4">
          <h2 className="sr-only">Plain English</h2>
          <PlainEnglishBox
            text={body.plain_english_child}
            level="child"
            collapsible={false}
          />
          <PlainEnglishBox
            text={body.plain_english_summary}
            level="layperson"
            collapsible={false}
          />
          <PlainEnglishBox text={body.mandate_summary} level="legal" collapsible={false} />
        </section>

        {body.tactics ? (
          <section className="py-8 border-t border-charcoal/10">
            <h2 className="font-serif text-2xl text-charcoal">How they worked</h2>
            <div className="mt-5 border-l-4 border-amber bg-amber/[0.04] pl-5 pr-4 py-4 rounded-r-xl text-sm leading-relaxed text-charcoal/85 whitespace-pre-wrap">
              {body.tactics}
            </div>
          </section>
        ) : null}

        {body.distinguishing_features ? (
          <section className="py-8 border-t border-charcoal/10">
            <h2 className="font-serif text-2xl text-charcoal">What made them different</h2>
            <p className="mt-4 text-base leading-relaxed text-charcoal/80 whitespace-pre-wrap">
              {body.distinguishing_features}
            </p>
          </section>
        ) : null}

        {body.was_political_disbanding === true ? (
          <section className="py-8 border-t border-charcoal/10">
            <div className="rounded-2xl border-l-4 border-charge-red bg-charge-red/[0.04] p-6 md:p-8">
              <h2 className="font-serif text-2xl text-charge-red">Why was it disbanded?</h2>
              <p className="mt-4 text-sm leading-relaxed text-charcoal/85 whitespace-pre-wrap">
                  {body.disbanded_reason ?? "The formal record of disbandment is still being summarised on The Record."}
                </p>
              {evidencePoints.length > 0 ? (
                <details className="mt-6 group">
                  <summary className="cursor-pointer font-mono text-[12px] text-charge-red hover:underline">
                    The evidence
                  </summary>
                  <ol className="mt-4 list-decimal pl-5 space-y-3 text-sm text-charcoal/80">
                    {evidencePoints.map((pt) => (
                      <li key={pt.slice(0, 48)}>{pt.replace(/^\d+\.\s*/, "")}</li>
                    ))}
                  </ol>
                </details>
              ) : null}
              <p className="mt-6 text-xs text-charcoal/55 italic border-t border-charcoal/10 pt-4">
                This is The Record&apos;s assessment based on public evidence, court findings,
                and official statements.
              </p>
            </div>
          </section>
        ) : null}

        {body.leadership_history && body.leadership_history.length > 0 ? (
          <section className="py-8 border-t border-charcoal/10">
            <h2 className="font-serif text-2xl text-charcoal">Leadership history</h2>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-charcoal/15">
                    <th className="py-2 pr-4 font-mono text-[10px] uppercase tracking-wider text-charcoal/45">
                      Name
                    </th>
                    <th className="py-2 pr-4 font-mono text-[10px] uppercase tracking-wider text-charcoal/45">
                      Title
                    </th>
                    <th className="py-2 font-mono text-[10px] uppercase tracking-wider text-charcoal/45">
                      Period
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {body.leadership_history.map((row) => (
                    <tr key={`${row.name}-${row.period_start}`} className="border-b border-charcoal/8">
                      <td className="py-3 pr-4 font-serif text-base text-charcoal">{row.name}</td>
                      <td className="py-3 pr-4 text-charcoal/80">{row.title}</td>
                      <td className="py-3 font-mono text-[11px] text-charcoal/55">
                        {row.period_start ?? "—"}
                        {row.period_end ? ` – ${row.period_end}` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {body.related_commissions.length > 0
          ? body.related_commissions.map((c) => (
              <section
                key={c.id}
                className="py-8 border-t border-charcoal/10 rounded-2xl border border-legal-blue/20 bg-legal-blue/[0.05] p-6 md:p-8"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-legal-blue/80">
                  Commission link
                </p>
                <h2 className="mt-3 font-serif text-xl text-charcoal">
                  <Link href={`/commissions/${c.slug}`} className="hover:text-amber transition-colors">
                    {c.popular_name}
                  </Link>{" "}
                  <span className="font-sans font-normal text-base text-charcoal/70">
                    investigated the {body.popular_name}
                  </span>
                </h2>
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-charcoal/85">
                  <p>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-charcoal/45">
                      What they found
                    </span>
                    <br />
                    {c.outcome_summary?.trim() ??
                      "Outcome summary not yet on The Record for this commission."}
                  </p>
                </div>
                <p className="mt-5">
                  <Link
                    href={`/commissions/${c.slug}`}
                    className="font-mono text-[12px] text-legal-blue hover:underline"
                  >
                    → Open commission dossier
                  </Link>
                </p>
              </section>
            ))
          : null}

        <HighProfileCasesSection
          body={body}
          cases={cases}
          storySlugById={storySlugById}
        />

        {body.legacy_summary ? (
          <section className="mt-12 md:mt-16 border-t border-charcoal/10 pt-10 md:pt-12">
            <h2 className="font-serif text-2xl text-charcoal">Legacy</h2>
            <p className="mt-6 font-serif text-xl md:text-2xl text-charcoal/80 leading-snug border-l-4 border-amber/40 pl-5">
              {yearsLabel}
            </p>
            <div className="mt-6 text-base leading-relaxed text-charcoal/85 whitespace-pre-wrap">
              {body.legacy_summary}
            </div>
          </section>
        ) : null}

        <SimilarStoriesStrip stories={similarBriefs} currentSlug="" />
      </div>

      {events.length > 0 ? (
        <section className="-mx-0 mt-10 md:mt-14" aria-label="Merged timeline">
          <h2 className="max-w-6xl mx-auto px-4 md:px-8 font-serif text-2xl text-charcoal mb-2">
            Timeline
          </h2>
          <p className="max-w-6xl mx-auto px-4 md:px-8 text-sm text-charcoal/55 mb-6">
            Events drawn from every story linked to this unit — the rise-and-fall spine in one
            place.
          </p>
          <AccountabilityBodyMergedTimeline events={events} bodySlug={body.slug} />
        </section>
      ) : null}
    </article>
  );
}
