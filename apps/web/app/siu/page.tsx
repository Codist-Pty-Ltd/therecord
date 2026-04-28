/**
 * /siu — the SIU Stats Dashboard.
 *
 * Unlike /commissions or /people, this page is about a PERMANENT BODY with
 * FINANCIAL OUTCOMES — not an individual inquiry. Composition leads with
 * the money:
 *
 *   1. Hero        — body identity + tagline
 *   2. Impact      — four enormous numbers (enrolled, recovered, prevented,
 *                    NPA referrals on PPE alone)
 *   3. How it works — collapsible 3-step explainer (proclamation → forensic
 *                    investigation → three-way referral)
 *   4. Referral chain — single proclamation fans into NPA / Departments /
 *                    Special Tribunal (interactive — taps filter the list)
 *   5. Proclamations list — tabs by status, editorial rows
 *   6. Special Tribunal — caseload sorted by value DESC
 *
 * Server Component. Three endpoints fetched in parallel — the SIU API
 * returns the body singleton + stats in one call (`/api/siu`), the full
 * proclamation list in another (`/api/siu/proclamations`), and the
 * Tribunal singleton + cases in a third (`/api/siu/tribunal`). Sections
 * 4 + 5 share UI state so they live inside one client component.
 */

import type { Metadata } from "next";
import Link from "next/link";

import HowItWorks from "@/components/Siu/HowItWorks";
import ProclamationsAndReferralChain from "@/components/Siu/ProclamationsAndReferralChain";
import TribunalCases from "@/components/Siu/TribunalCases";
import {
  getSiuOverview,
  getSpecialTribunal,
  listSiuProclamations,
} from "@/lib/api";
import { formatCountHero, formatRandsHero } from "@/lib/siu";

import type {
  SiuBody,
  SiuProclamationSummary,
  SiuStats,
  SpecialTribunal,
  SpecialTribunalCase,
} from "@the-record/shared-types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SIU Investigations",
  description:
    "The Special Investigating Unit's proclamations, Special Tribunal cases, and financial recovery figures.",
  alternates: {
    canonical: "https://therecord.co.za/siu",
  },
  openGraph: {
    type: "website",
    siteName: "The Record",
    locale: "en_ZA",
    title: "SIU — The State's Money Back",
    description:
      "Every Presidential Proclamation that activated South Africa's Special Investigating Unit. Mapped to the money investigated, recovered, and litigated.",
  },
};

// =============================================================================
// Page
// =============================================================================

export default async function SiuPage() {
  const [overview, proclamationsResult, tribunal] = await Promise.all([
    getSiuOverview(),
    listSiuProclamations(1, 100),
    getSpecialTribunal(),
  ]);

  if (!overview) {
    return <NotSeededState />;
  }

  const ppe = proclamationsResult.data.find(
    (p) => p.proclamation_number === "R23 of 2020",
  );

  return (
    <>
      <Hero body={overview.body} stats={overview.stats} ppe={ppe ?? null} />
      <HowItWorks />
      <ProclamationsAndReferralChain
        proclamations={proclamationsResult.data}
        highlightProclamation={ppe ?? undefined}
      />
      {tribunal ? (
        <TribunalSection
          tribunal={tribunal.tribunal}
          cases={tribunal.cases}
          totalCount={tribunal.total}
        />
      ) : null}
      <Footer body={overview.body} />
    </>
  );
}

// =============================================================================
// Hero — charcoal background, cream text, leads with the money
// =============================================================================

interface HeroProps {
  body: SiuBody;
  stats: SiuStats;
  /** PPE proclamation, used for the "87+ NPA referrals" headline tile. */
  ppe: SiuProclamationSummary | null;
}

function Hero({ body, stats, ppe }: HeroProps) {
  // Eyebrow built from body metadata so it stays accurate as the singleton
  // record evolves. Falls back to the editorial form when fields are missing.
  const established = body.established_date.match(/^(\d{4})/);
  const eyebrow = [
    "Permanent Statutory Body",
    established ? `Est. ${established[1]}` : null,
    body.headquarters,
  ]
    .filter((s): s is string => !!s)
    .join(" · ");

  // The four headline stats. Ordering is editorial — biggest pot of money
  // first (enrolled), then realised recoveries, then losses prevented,
  // then the human-readable referral count from the most-cited proclamation.
  const tiles: ReadonlyArray<{ value: string; label: string }> = [
    {
      value: formatRandsHero(stats.total_civil_litigation_rands),
      label: "Enrolled in Special Tribunal",
    },
    {
      value: formatRandsHero(stats.total_recovered_rands),
      label: "Cash & assets recovered",
    },
    {
      value: formatRandsHero(stats.total_prevented_rands),
      label: "Future losses prevented",
    },
    {
      value: ppe
        ? formatCountHero(ppe.npa_referrals)
        : formatCountHero(stats.total_npa_referrals),
      label: ppe
        ? "Cases referred to NPA (PPE alone)"
        : "Cases referred to NPA",
    },
  ];

  return (
    <section
      aria-labelledby="siu-hero-heading"
      className="relative bg-charcoal text-cream overflow-hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30 hidden lg:block"
        style={{
          backgroundImage:
            "radial-gradient(60% 50% at 80% 20%, rgba(200,101,27,0.22), transparent 60%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 md:px-8 pt-12 md:pt-20 pb-10 md:pb-16">
        <p className="font-mono text-[11px] md:text-xs uppercase tracking-[0.22em] text-amber mb-5 md:mb-7">
          {eyebrow}
        </p>

        <h1
          id="siu-hero-heading"
          className="font-serif text-[32px] md:text-5xl lg:text-[60px] leading-[1.04] tracking-[-0.015em] text-cream max-w-4xl"
        >
          The State&rsquo;s Money Back.
        </h1>

        <p className="mt-5 md:mt-7 font-sans text-[16px] md:text-lg lg:text-xl leading-[1.55] text-cream/70 max-w-3xl">
          The SIU investigates corruption and gets stolen public money
          returned. Activated by Presidential Proclamation. Litigates in
          the Special Tribunal.
        </p>

        <ImpactNumbers tiles={tiles} />
      </div>
    </section>
  );
}

function ImpactNumbers({
  tiles,
}: {
  tiles: ReadonlyArray<{ value: string; label: string }>;
}) {
  return (
    <div className="mt-9 md:mt-14 border-t border-cream/10 pt-8 md:pt-10">
      <dl className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 md:gap-10">
        {tiles.map((tile) => (
          <div key={tile.label} className="flex flex-col gap-1.5 md:gap-2">
            <dd className="font-serif text-[40px] md:text-5xl lg:text-[56px] leading-none text-amber">
              {tile.value}
            </dd>
            <dt className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-cream/55 leading-snug">
              {tile.label}
            </dt>
          </div>
        ))}
      </dl>

      <p className="mt-7 md:mt-9 font-serif italic text-[13px] md:text-sm text-amber/80 max-w-2xl">
        These figures cover selected proclamations only. Total SIU impact
        since 1997 is significantly larger.
      </p>
    </div>
  );
}

// =============================================================================
// Tribunal section wrapper — keeps the page composition tidy
// =============================================================================

function TribunalSection({
  tribunal,
  cases,
  totalCount,
}: {
  tribunal: SpecialTribunal;
  cases: ReadonlyArray<SpecialTribunalCase>;
  totalCount: number;
}) {
  return (
    <>
      <TribunalCases tribunal={tribunal} cases={cases} />
      {totalCount > cases.length ? (
        <p className="max-w-6xl mx-auto px-4 md:px-8 -mt-10 md:-mt-16 mb-10 md:mb-16 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-charcoal/45">
          Showing {cases.length} of {totalCount} cases on file.
        </p>
      ) : null}
    </>
  );
}

// =============================================================================
// Bottom-of-page footer — body metadata + hotline + report-corruption CTA
// =============================================================================

function Footer({ body }: { body: SiuBody }) {
  return (
    <section
      aria-labelledby="siu-footer-heading"
      className="bg-charcoal text-cream border-t border-cream/10"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16 grid gap-8 md:grid-cols-2 md:gap-12 items-start">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-amber mb-3">
            About the body
          </p>
          <h2
            id="siu-footer-heading"
            className="font-serif text-[24px] md:text-[34px] leading-[1.15] text-cream"
          >
            {body.name}.
          </h2>
          <p className="mt-3 font-sans text-[14px] md:text-base leading-relaxed text-cream/70 max-w-xl">
            {body.plain_english_summary}
          </p>
          <p className="mt-3 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-cream/50">
            {body.enabling_legislation}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl bg-cream/5 border border-cream/10 p-5 md:p-6">
            <p className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-amber mb-2">
              Report corruption
            </p>
            <p className="font-serif text-[20px] md:text-2xl text-cream">
              {body.hotline}
            </p>
            <p className="mt-2 font-sans text-[13px] text-cream/60">
              The SIU runs a national hotline for whistleblowers. Calls are
              confidential and can be made anonymously.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {body.website_url ? (
              <Link
                href={body.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-amber text-charcoal rounded-full px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] hover:bg-cream transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-amber/40"
              >
                Visit siu.org.za
                <span aria-hidden>↗</span>
              </Link>
            ) : null}
            <Link
              href="/commissions"
              className="inline-flex items-center gap-2 bg-transparent text-cream rounded-full px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] border border-cream/25 hover:border-amber hover:text-amber transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/40"
            >
              Compare with commissions
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// "Not seeded yet" empty state — when the API responds 404 to /api/siu
// (the SIU body singleton hasn't been seeded in this environment).
// =============================================================================

function NotSeededState() {
  return (
    <section className="bg-cream min-h-[70vh] flex items-center justify-center px-4 py-16 md:py-24">
      <div className="max-w-xl w-full text-center flex flex-col items-center gap-5 md:gap-6">
        <span
          aria-hidden
          className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-amber/15 text-amber text-2xl md:text-3xl"
        >
          ⚖
        </span>
        <p className="label-smallcaps text-amber">SIU dataset offline</p>
        <h1 className="font-serif text-[28px] md:text-4xl leading-tight text-charcoal">
          The SIU record hasn&rsquo;t been seeded in this environment.
        </h1>
        <p className="font-sans text-base md:text-lg text-charcoal/70 leading-relaxed max-w-md">
          The Special Investigating Unit body, proclamations, and Special
          Tribunal cases are managed as a single dataset. Once the SIU
          seed has been run against this database, the dashboard will
          render here.
        </p>
        <Link
          href="/commissions"
          className="inline-flex items-center gap-2 bg-charcoal text-cream rounded-full px-5 py-2.5 font-mono text-[11px] md:text-xs uppercase tracking-[0.18em] hover:bg-amber transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-amber/40"
        >
          Browse Commissions instead
          <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}
