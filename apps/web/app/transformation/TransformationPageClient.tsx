"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

import SimilarStoriesStrip from "@/components/Story/SimilarStoriesStrip";
import { PolicyPlainEnglishBox } from "@/components/transformation/PolicyPlainEnglishBox";
import TransformationStoryTimeline from "@/components/transformation/TransformationStoryTimeline";
import { TransformationReadingLevelProvider } from "@/components/transformation/ReadingLevelContext";
import TransformationReadingLevelTabs from "@/components/transformation/TransformationReadingLevelTabs";
import {
  BBEE_SCORECARD_ELEMENTS,
  LEGAL_SECTOR_CASE_PLAIN,
} from "@/components/transformation/transformation-content";
import { parseNumberedPolicyArguments } from "@/lib/parse-policy-arguments";
import type { StoryDetail, TransformationPolicy } from "@the-record/shared-types";

function ScorecardBlock() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="mt-8">
      <div className="hidden overflow-x-auto rounded-2xl border border-charcoal/10 bg-white shadow-sm md:block">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-charcoal/10 bg-cream/80">
              <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-charcoal/55">
                Element
              </th>
              <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-charcoal/55">
                What it measures
              </th>
            </tr>
          </thead>
          <tbody>
            {BBEE_SCORECARD_ELEMENTS.map((row) => (
              <tr
                key={row.name}
                className="border-b border-charcoal/5 last:border-b-0"
              >
                <td className="w-[28%] px-5 py-4 align-top font-serif text-base text-charcoal">
                  {row.name}
                </td>
                <td className="px-5 py-4 align-top font-sans text-[15px] leading-relaxed text-charcoal/80">
                  {row.summary}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2 md:hidden">
        {BBEE_SCORECARD_ELEMENTS.map((row, i) => {
          const open = openIdx === i;
          return (
            <div
              key={row.name}
              className="overflow-hidden rounded-xl border border-charcoal/10 bg-white shadow-sm"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(open ? null : i)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/40"
              >
                <span className="font-serif text-base text-charcoal">
                  {row.name}
                </span>
                <span className="font-mono text-sm text-charcoal/50">
                  {open ? "−" : "+"}
                </span>
              </button>
              {open ? (
                <p className="border-t border-charcoal/5 px-4 pb-4 pt-0 text-sm leading-relaxed text-charcoal/80">
                  {row.summary}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ParticipationCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="flex h-full flex-col gap-3 rounded-2xl border border-charcoal/10 bg-white p-4 shadow-sm md:p-5">
      <h3 className="font-serif text-lg leading-snug text-charcoal md:text-xl">
        {title}
      </h3>
      <div className="flex flex-1 flex-col gap-2 text-sm leading-relaxed text-charcoal/80">
        {children}
      </div>
    </article>
  );
}

export default function TransformationPageClient({
  policy,
  story,
}: {
  policy: TransformationPolicy;
  story: StoryDetail;
}) {
  const forArgs = parseNumberedPolicyArguments(policy.arguments_for);
  const againstArgs = parseNumberedPolicyArguments(policy.arguments_against);

  return (
    <TransformationReadingLevelProvider>
      <div className="min-h-screen bg-cream pb-20">
        <header className="bg-charcoal px-4 py-12 text-cream md:px-8 md:py-16">
          <div className="mx-auto max-w-6xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-amber md:text-[11px]">
              Economic transformation · South Africa
            </p>
            <h1 className="mt-4 max-w-3xl font-serif text-[28px] leading-tight tracking-tight text-cream md:text-[32px]">
              The economy apartheid built.
              <br />
              The law meant to change it.
            </h1>
            <p className="mt-6 max-w-2xl font-sans text-sm leading-relaxed text-cream/70 md:text-[14px]">
              B-BBEE is not just a business law. It is the state&apos;s answer
              to a 350-year economic question. Here is the full history — and
              the live debate.
            </p>
          </div>
        </header>

        <TransformationReadingLevelTabs />

        <main className="mx-auto max-w-6xl space-y-16 px-4 pt-10 md:space-y-24 md:px-8 md:pt-14">
          <section aria-labelledby="stats-heading">
            <h2
              id="stats-heading"
              className="font-serif text-2xl text-charcoal md:text-3xl"
            >
              Before we explain the law, here are the numbers.
            </h2>

            <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
              <div>
                <p className="font-serif text-4xl text-amber tabular-nums md:text-5xl">
                  5%
                </p>
                <p className="mt-2 font-sans text-sm leading-relaxed text-charcoal/85 md:text-[15px]">
                  Black household wealth as a share of white household wealth
                  (median comparison, 2025).
                </p>
                <p className="mt-2 font-sans text-[11px] text-charcoal/50">
                  Source: World Inequality Lab / Wits Southern Centre for
                  Inequality Studies — median black household wealth about
                  R70,000 vs median white about R1.36 million (2025 series
                  referenced in editorial seeds).
                </p>
              </div>
              <div>
                <p className="font-serif text-4xl text-amber tabular-nums md:text-5xl">
                  86%
                </p>
                <p className="mt-2 font-sans text-sm leading-relaxed text-charcoal/85 md:text-[15px]">
                  Share of wealth held by the top 10% of South Africans.
                </p>
                <p className="mt-2 font-sans text-[11px] text-charcoal/50">
                  Source: World Bank (2022 wealth distribution reporting widely
                  cited for South Africa&apos;s top-decile concentration).
                </p>
              </div>
              <div>
                <p className="font-serif text-4xl text-amber tabular-nums md:text-5xl">
                  80%
                </p>
                <p className="mt-2 font-sans text-sm leading-relaxed text-charcoal/85 md:text-[15px]">
                  Land in white minority ownership at democratic transition
                  (1994).
                </p>
                <p className="mt-2 font-sans text-[11px] text-charcoal/50">
                  Source: PLAAS (Institute for Poverty, Land and Agrarian
                  Studies) — documented racial land ownership at 1994.
                </p>
              </div>
              <div>
                <p className="font-serif text-4xl text-amber tabular-nums md:text-5xl">
                  30 yrs
                </p>
                <p className="mt-2 font-sans text-sm leading-relaxed text-charcoal/85 md:text-[15px]">
                  Since the end of apartheid — the median racial wealth ratio has
                  barely shifted.
                </p>
                <p className="mt-2 font-sans text-[11px] text-charcoal/50">
                  Source: editorial synthesis of inequality research (World
                  Inequality Lab / SCIS, World Bank); see linked story dossier
                  for citations on timeline events.
                </p>
              </div>
            </div>

            <p className="mt-8 text-center">
              <Link
                href="/history"
                className="font-mono text-[11px] uppercase tracking-wider text-legal-blue hover:text-amber underline-offset-4"
              >
                See the full historical record →
              </Link>
            </p>

            <p className="mt-10 text-center font-serif text-base italic text-amber md:text-lg">
              These numbers are the reason the law exists.
            </p>
          </section>

          <section aria-labelledby="history-heading">
            <h2
              id="history-heading"
              className="font-serif text-2xl text-charcoal md:text-3xl"
            >
              How the economy was built — and for whom
            </h2>
            <p className="mt-4 max-w-3xl font-sans text-sm leading-relaxed text-charcoal/75 md:text-[15px]">
              Events before 1994 are shown with muted nodes: they fall outside
              The Record&apos;s usual post-democracy accountability frame, but
              they are indispensable to understanding why Parliament passed
              B-BBEE. Full dossier:{" "}
              <Link
                href={`/story/${story.slug}`}
                className="text-legal-blue underline decoration-legal-blue/30 underline-offset-4 hover:text-amber"
              >
                {story.title}
              </Link>
              .
            </p>
            <div className="mt-10">
              <TransformationStoryTimeline
                events={story.timeline_events}
                storySlug={story.slug}
                mutedBeforeYear={1994}
                transitionElectionNote="Political freedom. Economic ownership unchanged."
              />
            </div>
          </section>

          <section aria-labelledby="what-heading">
            <h2
              id="what-heading"
              className="font-serif text-2xl text-charcoal md:text-3xl"
            >
              What is B-BBEE?
            </h2>
            <p className="mt-4 max-w-3xl font-sans text-sm leading-relaxed text-charcoal/80 md:text-base">
              {policy.purpose_summary}
            </p>

            <div className="mt-8">
              <PolicyPlainEnglishBox
                plainEnglishChild={policy.plain_english_child}
                plainEnglishLayperson={policy.plain_english_layperson}
                plainEnglishLegal={policy.plain_english_legal}
                collapsible={false}
              />
            </div>

            <ScorecardBlock />
          </section>

          <section aria-labelledby="debate-heading">
            <h2
              id="debate-heading"
              className="font-serif text-2xl text-charcoal md:text-3xl"
            >
              The debate
            </h2>
            <p className="mt-3 max-w-3xl font-sans text-sm text-charcoal/70 md:text-[15px]">
              The Record presents both sides. You decide.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
              <div className="border-l-4 border-amber pl-5 md:pl-6">
                <h3 className="font-serif text-xl text-charcoal">
                  The case for transformation
                </h3>
                <ol className="mt-6 flex flex-col gap-6">
                  {forArgs.map((pt, idx) => (
                    <li key={`for-${pt.title}-${idx}`} className="flex gap-3">
                      <span
                        className="font-mono text-xs tabular-nums text-amber"
                        aria-hidden
                      >
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1">
                        <p className="font-serif text-base font-medium text-charcoal md:text-lg">
                          {pt.title}
                        </p>
                        {pt.detail ? (
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-charcoal/80 md:text-[15px]">
                            {pt.detail}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="border-l-4 border-legal-blue pl-5 md:pl-6">
                <p className="font-sans text-[13px] leading-relaxed text-charcoal/70 md:text-sm">
                  These are not arguments against transformation — they are
                  arguments about whether this mechanism achieves it.
                </p>
                <h3 className="mt-5 font-serif text-xl text-charcoal">
                  The case against B-BBEE as currently designed
                </h3>
                <ol className="mt-6 flex flex-col gap-6">
                  {againstArgs.map((pt, idx) => (
                    <li
                      key={`against-${pt.title}-${idx}`}
                      className="flex gap-3"
                    >
                      <span
                        className="font-mono text-xs tabular-nums text-legal-blue"
                        aria-hidden
                      >
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1">
                        <p className="font-serif text-base font-medium text-charcoal md:text-lg">
                          {pt.title}
                        </p>
                        {pt.detail ? (
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-charcoal/80 md:text-[15px]">
                            {pt.detail}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <p className="mx-auto mt-12 max-w-3xl text-center font-sans text-sm leading-relaxed text-charcoal/70">
              The Record does not take a position on this debate. These are the
              arguments made by serious people on each side. The outcome of the
              Legal Sector Code case (May 2026) may clarify some of them.
            </p>
          </section>

          <section aria-labelledby="court-heading">
            <h2
              id="court-heading"
              className="font-serif text-2xl text-charcoal md:text-3xl"
            >
              Live: In court right now
            </h2>

            <div className="mt-8 rounded-2xl border-l-4 border-legal-blue bg-white p-5 shadow-sm md:p-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-charge-red">
                Live · judgment pending
              </p>
              <h3 className="mt-3 font-serif text-xl text-charcoal md:text-2xl">
                B-BBEE Legal Sector Code challenge
              </h3>
              <dl className="mt-6 grid gap-3 font-sans text-sm text-charcoal/85 md:grid-cols-2 md:gap-x-10 md:gap-y-4 md:text-[15px]">
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-charcoal/45">
                    Court
                  </dt>
                  <dd className="mt-1">Gauteng High Court, Pretoria</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-charcoal/45">
                    Dates
                  </dt>
                  <dd className="mt-1">4–8 May 2026</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-charcoal/45">
                    Judge
                  </dt>
                  <dd className="mt-1">Nicolene Janse van Nieuwenhuizen</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-charcoal/45">
                    Status
                  </dt>
                  <dd className="mt-1">
                    Hearing concluded — judgment pending
                  </dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-charcoal/45">
                    Challenging (applicants)
                  </dt>
                  <dd className="mt-1">
                    Deneys Reitz / Norton Rose Fulbright, Bowmans, Webber
                    Wentzel, Werksmans — with Solidarity
                  </dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-charcoal/45">
                    Defending (respondents)
                  </dt>
                  <dd className="mt-1">
                    Black Business Council, Black Lawyers Association, Legal
                    Practice Council, Advocates for Transformation, Nadel,
                    Department of Trade, Industry and Competition (and other
                    executive respondents — see court papers).
                  </dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-charcoal/45">
                    Core question
                  </dt>
                  <dd className="mt-1">
                    Is the Legal Sector Code constitutional and lawful?
                  </dd>
                </div>
              </dl>

              <div className="mt-8">
                <PolicyPlainEnglishBox
                  plainEnglishChild={LEGAL_SECTOR_CASE_PLAIN.child}
                  plainEnglishLayperson={LEGAL_SECTOR_CASE_PLAIN.layperson}
                  plainEnglishLegal={LEGAL_SECTOR_CASE_PLAIN.legal}
                  collapsible={false}
                />
              </div>
            </div>

            <div className="mt-8 rounded-xl border border-charcoal/10 bg-white/80 p-5 md:p-6">
              <h3 className="font-serif text-lg text-charcoal md:text-xl">
                Sakeliga v Air Services Licensing Council
              </h3>
              <p className="mt-2 font-sans text-sm text-charcoal/75">
                Pretoria High Court — August 2025
              </p>
              <p className="mt-4 font-sans text-sm leading-relaxed text-charcoal/85 md:text-[15px]">
                Outcome: Sakeliga succeeded — air service licences could not, on
                the facts pleaded, be conditioned on a B-BBEE score in the manner
                challenged.
              </p>
              <p className="mt-3 font-sans text-sm leading-relaxed text-charcoal/85 md:text-[15px]">
                Significance: often described as the first significant court
                limitation on how B-BBEE requirements attach to statutory
                licensing — its exact ratio is limited to its own record.
              </p>
            </div>
          </section>

          <section aria-labelledby="participate-heading">
            <h2
              id="participate-heading"
              className="font-serif text-2xl text-charcoal md:text-3xl"
            >
              This is your law. Here is how you participate.
            </h2>
            <p className="mt-4 max-w-3xl font-sans text-sm leading-relaxed text-charcoal/75 md:text-[15px]">
              Every South African can engage with how B-BBEE works. Parliament
              passes these laws. Parliament can change them. Here is how.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <ParticipationCard title="Submit to Parliament">
                <p>
                  When parliamentary committees publish calls for comment on BEE
                  amendments or employment-equity bills, any person can file a
                  written submission. You do not need a lawyer.
                </p>
                <p>
                  How:{" "}
                  <a
                    href="https://www.parliament.gov.za"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-legal-blue underline decoration-legal-blue/30 underline-offset-2 hover:text-amber"
                  >
                    parliament.gov.za
                  </a>{" "}
                  → committees → open for comment. Your submission becomes part
                  of the public record.
                </p>
              </ParticipationCard>

              <ParticipationCard title="The B-BBEE Commission">
                <p>
                  If you believe a company is fronting — pretending to have black
                  ownership or control without genuine empowerment — you can
                  report it. The B-BBEE Commission investigates fronting
                  complaints.
                </p>
                <p>
                  Contact:{" "}
                  <a
                    href="https://www.bbbeecommission.org.za"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-legal-blue underline decoration-legal-blue/30 underline-offset-2 hover:text-amber"
                  >
                    bbbeecommission.org.za
                  </a>{" "}
                  · 012 394 3200
                </p>
                <p>
                  This is how the law enforces itself — through reporting and
                  investigation.
                </p>
              </ParticipationCard>

              <ParticipationCard title="Employment equity complaints">
                <p>
                  If you face unfair discrimination in hiring, promotion, or
                  treatment at work, you can pursue dispute resolution at the
                  CCMA and channels through the Department of Employment and
                  Labour.
                </p>
                <p>You do not need a lawyer to start a CCMA referral.</p>
              </ParticipationCard>

              <ParticipationCard title="Vote in elections">
                <p>
                  The ANC, DA, EFF, MK, and other parties take different
                  positions on B-BBEE and transformation. Who holds office shapes
                  how these laws are written and enforced.
                </p>
                <p>
                  IEC:{" "}
                  <a
                    href="https://www.elections.org.za/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-legal-blue underline decoration-legal-blue/30 underline-offset-2 hover:text-amber"
                  >
                    iec.org.za
                  </a>{" "}
                  — register and vote.
                </p>
              </ParticipationCard>

              <ParticipationCard title="Brief black advocates and attorneys">
                <p>
                  One of the most powerful things any client — government or
                  private — can do is deliberately brief black legal
                  professionals with real file responsibility.
                </p>
                <p>
                  The Legal Sector Code exists partly because briefing patterns
                  (who gets the work) stayed racially skewed long after 1994. Your
                  choice of professional is a market decision with public
                  consequence.
                </p>
              </ParticipationCard>

              <ParticipationCard title="Engage your ward councillor">
                <p>
                  B-BBEE appears in municipal procurement, housing programmes,
                  and service contracts. Your ward councillor is accountable to
                  voters for how public money is spent.
                </p>
                <p>
                  IEC ward lookup:{" "}
                  <a
                    href="https://www.elections.org.za/pw/MyMunicipality.aspx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-legal-blue underline decoration-legal-blue/30 underline-offset-2 hover:text-amber"
                  >
                    elections.org.za
                  </a>
                </p>
              </ParticipationCard>
            </div>

            <p className="mt-12 max-w-3xl font-sans text-xs italic leading-relaxed text-amber md:text-sm">
              The legal challenge being heard this week in Pretoria was brought
              by four law firms and a trade union. It is opposed by multiple
              legal bodies, government departments, and communities of black
              professionals. Both sides will be heard. The judge decides. But
              the law that makes the judge able to hear this case at all is the
              same Constitution that created the space for B-BBEE.
            </p>
          </section>

          <section aria-labelledby="related-heading">
            <h2
              id="related-heading"
              className="font-serif text-2xl text-charcoal md:text-3xl"
            >
              Connected on The Record
            </h2>
            <p className="mt-3 max-w-3xl font-sans text-sm text-charcoal/70">
              Stories where formal BEE metrics met tender corruption, fronting,
              or state-capture procurement — and commissions that examined those
              patterns.
            </p>

            <SimilarStoriesStrip
              stories={story.similar_stories ?? []}
              currentSlug={story.slug}
            />

            <ul className="mt-8 flex flex-col gap-3 md:flex-row md:flex-wrap">
              <li>
                <Link
                  href="/commissions/zondo-commission-state-capture"
                  className="inline-flex rounded-xl border border-charcoal/10 bg-white px-4 py-3 text-sm text-legal-blue transition hover:border-amber/40 hover:bg-amber/[0.04]"
                >
                  Zondo Commission — state capture &amp; procurement
                </Link>
              </li>
              <li>
                <Link
                  href={`/story/${story.slug}`}
                  className="inline-flex rounded-xl border border-charcoal/10 bg-white px-4 py-3 text-sm text-legal-blue transition hover:border-amber/40 hover:bg-amber/[0.04]"
                >
                  Full B-BBEE story dossier &amp; timeline
                </Link>
              </li>
            </ul>
          </section>
        </main>
      </div>
    </TransformationReadingLevelProvider>
  );
}
