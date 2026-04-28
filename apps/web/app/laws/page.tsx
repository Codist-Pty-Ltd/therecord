/**
 * /laws — the editorial index of every South African statute referenced
 * across The Record. Mirrors the visual language of the /commissions and
 * /siu indexes (charcoal hero → cream editorial body) but optimised for
 * legal browsing: rows, not cards; grouped by category; expand-in-place
 * to reveal sections rather than navigating away.
 *
 * Server Component. The list fetch is unpaginated server-side — there are
 * a small fixed set of statutes in scope and they all need to render in
 * the editorial flow.
 */

import type { Metadata } from "next";

import LawList from "@/components/Laws/LawList";
import { getLaw, listLaws } from "@/lib/api";
import { LAW_CATEGORY_LABELS } from "@/lib/laws";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Laws — every Act that shapes South African accountability",
  description:
    "Every South African statute applied in commissions, court cases, and investigations on The Record. Each Act explained in plain language, with every section that matters.",
  alternates: {
    canonical: "https://therecord.co.za/laws",
  },
  openGraph: {
    type: "website",
    siteName: "The Record",
    locale: "en_ZA",
    title: "The Laws — The Record",
    description:
      "Every South African statute applied in commissions, court cases, and investigations on The Record. Explained in plain language.",
  },
};

export default async function LawsPage() {
  // Step 1: fetch the flat list of laws (no sections inlined on this endpoint).
  const laws = await listLaws();

  // Step 2: hydrate each law with its sections in parallel. There are a couple
  // of dozen statutes at most, so this is a cheap one-shot. Each `getLaw` call
  // is wrapped in `cache()` + tagged ISR so any consumer (this page,
  // metadata, the section detail page) shares the same fetch within a request.
  const detailed = await Promise.all(
    laws.map(async (law) => {
      const full = await getLaw(law.id);
      // If a law row exists in the list but `getLaw` 404s, treat it as
      // sections-not-yet-seeded rather than dropping the row entirely.
      return {
        ...law,
        sections: full?.sections ?? [],
      };
    }),
  );

  const totalSections = detailed.reduce((acc, l) => acc + l.sections.length, 0);
  const distinctCategories = new Set(detailed.map((l) => l.category)).size;

  return (
    <>
      <Hero
        actCount={detailed.length}
        sectionCount={totalSections}
        categoryCount={distinctCategories}
      />
      <main className="bg-cream">
        <div className="max-w-5xl mx-auto pb-16 md:pb-20">
          <LawList laws={detailed} />
          <FootNote />
        </div>
      </main>
    </>
  );
}

// =============================================================================
// Hero — leads with the editorial promise: "the laws behind the headlines".
// =============================================================================

interface HeroProps {
  actCount: number;
  sectionCount: number;
  categoryCount: number;
}

function Hero({ actCount, sectionCount, categoryCount }: HeroProps) {
  return (
    <section className="bg-charcoal text-cream">
      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-12 md:pt-20 pb-10 md:pb-16">
        <p className="label-smallcaps text-amber">
          The Record · Legal Index
        </p>

        <h1 className="font-serif text-[32px] md:text-[52px] leading-[1.05] mt-5 md:mt-6 text-cream">
          The Laws.
        </h1>

        <p className="font-sans text-[16px] md:text-[19px] text-cream/75 leading-relaxed mt-6 md:mt-8 max-w-2xl">
          Every South African statute applied in commissions, court cases, and
          investigations on this platform.{" "}
          <span className="text-cream">Explained in plain language.</span>
        </p>

        <div className="mt-9 md:mt-12 grid grid-cols-3 gap-6 md:gap-10 border-t border-cream/10 pt-8 md:pt-10">
          <Stat value={actCount} label="Acts tracked" />
          <Stat value={sectionCount} label="Sections explained" />
          <Stat value={categoryCount} label="Areas of law" />
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col gap-1.5 md:gap-2">
      <span className="font-serif text-[34px] md:text-[48px] leading-none text-cream tabular-nums">
        {value.toLocaleString("en-ZA")}
      </span>
      <span className="label-smallcaps text-cream/55">{label}</span>
    </div>
  );
}

// =============================================================================
// Foot note — sets expectations about what's in scope.
// =============================================================================

function FootNote() {
  return (
    <div className="px-4 md:px-8 pt-10 md:pt-12">
      <p className="font-sans text-[13.5px] md:text-[14px] text-charcoal/55 leading-relaxed max-w-3xl">
        We track {Object.keys(LAW_CATEGORY_LABELS).length} categories of South
        African law — corruption, policing, prosecution, organised crime,
        whistleblower protection, constitutional, and other. The list grows as
        new statutes appear on The Record&apos;s timeline. Every section page
        shows the original legal text alongside a plain-English explanation,
        and lists every commission, committee, and story where the section has
        been applied or alleged.
      </p>
    </div>
  );
}
