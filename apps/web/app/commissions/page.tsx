/**
 * /commissions — the editorial index of every accountability body that
 * has investigated the South African state since 1994.
 *
 * The page is conceptually titled "Accountability Bodies" — covering BOTH
 * commissions of inquiry (executive, Section 84(2)(f)) and ad hoc
 * parliamentary committees (legislative, NA Rule 253). The URL stays
 * `/commissions` because (a) external links and search engines already
 * point here and (b) "commission" remains the dominant frame of reference
 * in everyday SA political language.
 *
 * Server Component. Both datasets are pulled in one parallel round-trip —
 * there are ~22 commissions and ~10 committees today, well under the 100
 * page-size ceiling on either endpoint, so a single fetch each is enough
 * for the full editorial list.
 */

import type { Metadata } from "next";
import Link from "next/link";

import AccountabilityIndex from "@/components/Commissions/AccountabilityIndex";
import DistinctionPanel from "@/components/Commissions/DistinctionPanel";
import { listAdhocCommittees, listCommissions } from "@/lib/api";
import { producedAnyOutcome } from "@/lib/adhoc";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "30 Years of Accountability — Commissions & Committees",
  description:
    "Every national commission of inquiry and parliamentary ad hoc committee in South Africa since 1994. Two branches of government. One accountability record.",
  alternates: {
    canonical: "https://therecord.co.za/commissions",
  },
  openGraph: {
    type: "website",
    siteName: "The Record",
    locale: "en_ZA",
    title: "30 Years of Accountability — The Record",
    description:
      "Every national commission of inquiry and parliamentary ad hoc committee in South Africa since 1994.",
  },
};

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default async function CommissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const sp = await searchParams;
  const tabParam = Array.isArray(sp.tab) ? sp.tab[0] : sp.tab;
  const initialAdhocTab =
    tabParam === "adhoc" ? ("committees" as const) : ("commissions" as const);

  // Parallel fetch — a single round-trip for both lists. Each helper wraps
  // a tagged ISR fetch so revalidation is independent (a new commission
  // doesn't bust the committees cache and vice versa).
  const [{ data: commissions }, { data: committees }] = await Promise.all([
    listCommissions(1, 100),
    listAdhocCommittees(1, 100),
  ]);

  const stats = computeStats(commissions, committees);

  return (
    <>
      <Hero stats={stats} />
      <DistinctionPanel />
      <AccountabilityIndex
        commissions={commissions}
        committees={committees}
        initialTab={initialAdhocTab}
      />
      <PatternAnalysis stats={stats} />
    </>
  );
}

// =============================================================================
// Stats — derived from both datasets
// =============================================================================

interface Stats {
  commissionCount: number;
  committeeCount: number;
  /**
   * Commissions whose status is `active` or `pending_report`, plus any
   * committee whose status is `active`. Both branches' "still working"
   * states rolled into one figure so the hero stat reflects what's open
   * across the whole accountability landscape today.
   */
  activeCount: number;
  /**
   * Bodies that produced a real-world consequence: a commission with
   * `produced_prosecutions === true`, OR a committee with either
   * `produced_accountability_action === true` or
   * `produced_legislative_change === true`. This is the answer to the
   * question every South African asks — "did anything actually happen?"
   */
  consequenceCount: number;
  // Kept for the pattern-analysis section below.
  noProsecutionCount: number;
  criminalJusticeCount: number;
}

function computeStats(
  commissions: Awaited<ReturnType<typeof listCommissions>>["data"],
  committees: Awaited<ReturnType<typeof listAdhocCommittees>>["data"],
): Stats {
  let activeCount = 0;
  let consequenceCount = 0;
  let noProsecutionCount = 0;
  let criminalJusticeCount = 0;

  for (const c of commissions) {
    if (c.status === "active" || c.status === "pending_report") {
      activeCount += 1;
    }
    if (c.produced_prosecutions === true) consequenceCount += 1;
    else if (c.produced_prosecutions === false) noProsecutionCount += 1;

    if (c.domain === "criminal_justice") criminalJusticeCount += 1;
  }

  for (const c of committees) {
    if (c.status === "active") activeCount += 1;
    if (producedAnyOutcome(c)) consequenceCount += 1;
  }

  return {
    commissionCount: commissions.length,
    committeeCount: committees.length,
    activeCount,
    consequenceCount,
    noProsecutionCount,
    criminalJusticeCount,
  };
}

// =============================================================================
// Hero
// =============================================================================

function Hero({ stats }: { stats: Stats }) {
  return (
    <section
      aria-labelledby="commissions-hero-heading"
      className="bg-charcoal text-cream"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-12 md:pt-20 pb-10 md:pb-16">
        <p className="font-mono text-[11px] md:text-xs uppercase tracking-[0.22em] text-amber mb-5 md:mb-7">
          Accountability Bodies
        </p>

        <h1
          id="commissions-hero-heading"
          className="font-serif text-[30px] md:text-5xl lg:text-6xl leading-[1.05] tracking-[-0.01em] text-cream max-w-4xl"
        >
          30 Years of Accountability
        </h1>

        <p className="mt-5 md:mt-7 font-sans text-[15px] md:text-lg lg:text-xl leading-[1.55] text-cream/70 max-w-3xl">
          Every national commission and parliamentary inquiry since 1994. Two
          branches of government. One accountability record.
        </p>

        <StatRow stats={stats} />
      </div>
    </section>
  );
}

function StatRow({ stats }: { stats: Stats }) {
  const cells = [
    { value: String(stats.commissionCount), label: "Commissions of Inquiry" },
    { value: String(stats.committeeCount), label: "Ad Hoc Committees" },
    { value: String(stats.activeCount), label: "Currently active" },
    {
      value: String(stats.consequenceCount),
      label: "Produced real consequences",
    },
  ];

  return (
    <dl className="mt-9 md:mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 border-t border-cream/10 pt-8 md:pt-10">
      {cells.map((cell) => (
        <div key={cell.label} className="flex flex-col gap-1.5 md:gap-2">
          <dt className="order-2 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-cream/55">
            {cell.label}
          </dt>
          <dd className="order-1 font-serif text-[34px] md:text-5xl lg:text-[56px] leading-none text-amber">
            {cell.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// =============================================================================
// Pattern analysis (commissions-only — the bottom-of-page editorial summary)
// =============================================================================

function PatternAnalysis({ stats }: { stats: Stats }) {
  return (
    <section
      aria-labelledby="commissions-patterns-heading"
      className="bg-charcoal/[0.04] border-t border-charcoal/10"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <p className="label-smallcaps text-amber mb-3">Pattern analysis</p>
        <h2
          id="commissions-patterns-heading"
          className="font-serif text-[26px] md:text-4xl lg:text-[42px] leading-[1.1] tracking-[-0.01em] text-charcoal max-w-3xl"
        >
          What the data shows.
        </h2>
        <p className="mt-3 md:mt-4 font-sans text-[14px] md:text-base text-charcoal/65 max-w-2xl">
          Three decades of commissions, read at a glance. Click through to the
          evidence.
        </p>

        <div className="mt-8 md:mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <InsightBlock
            value={String(stats.noProsecutionCount)}
            title="Most commissions produced no prosecutions"
            body="Public inquiries that closed without anyone being charged. A pattern, not an accident."
            accent="charge-red"
            href="#"
          />

          <InsightBlock
            value={String(stats.criminalJusticeCount)}
            title="Criminal justice inquiries are the most common"
            body="When the system is asked to investigate itself, it happens in public. Again and again."
            accent="legal-blue"
            href="/commissions?domain=criminal_justice"
          />

          <InsightBlock
            value="Cross-linked"
            title="The same people appear across multiple commissions"
            body="Judges, witnesses, and implicated figures reappear for decades. Follow them across the archive."
            accent="amber"
            href="/people"
          />
        </div>
      </div>
    </section>
  );
}

interface InsightBlockProps {
  value: string;
  title: string;
  body: string;
  accent: "charge-red" | "legal-blue" | "amber";
  href: string;
}

function InsightBlock({ value, title, body, accent, href }: InsightBlockProps) {
  const accentTextClass = {
    "charge-red": "text-charge-red",
    "legal-blue": "text-legal-blue",
    amber: "text-amber",
  }[accent];

  const accentBorderClass = {
    "charge-red": "border-charge-red/40",
    "legal-blue": "border-legal-blue/40",
    amber: "border-amber/45",
  }[accent];

  return (
    <Link
      href={href}
      className={[
        "group block bg-cream rounded-xl md:rounded-2xl",
        "border border-charcoal/10",
        "p-5 md:p-7",
        "transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(28,28,30,0.08)]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/40",
      ].join(" ")}
    >
      <div
        className={`flex items-baseline gap-3 pb-3 mb-3 md:mb-4 border-b-2 ${accentBorderClass}`}
      >
        <span
          className={`font-serif text-[32px] md:text-4xl lg:text-[44px] leading-none ${accentTextClass}`}
        >
          {value}
        </span>
      </div>

      <h3 className="font-serif text-[18px] md:text-[22px] leading-[1.25] text-charcoal">
        {title}
      </h3>

      <p className="mt-3 font-sans text-[13px] md:text-sm leading-relaxed text-charcoal/65">
        {body}
      </p>

      <span className="mt-5 inline-flex items-center gap-1.5 font-mono text-[11px] md:text-xs uppercase tracking-[0.18em] text-amber">
        Explore
        <span
          aria-hidden
          className="transition-transform group-hover:translate-x-0.5"
        >
          →
        </span>
      </span>
    </Link>
  );
}
