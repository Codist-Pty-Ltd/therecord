/**
 * /laws/[lawId]/[sectionId] — the editorial detail page for a single
 * statute section. Bundles the plain-English explanation, the original
 * legal text, and every commission, ad hoc committee, and story on The
 * Record where the section has been invoked.
 *
 * Server Component. The single fetch returns everything we need — the
 * backend assembles the reverse-cross-link sets (including SIU) in
 * parallel so we don't fan out from the frontend.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import AppliedIn from "@/components/Laws/AppliedIn";
import LegalTextCollapse from "@/components/Laws/LegalTextCollapse";
import PlainEnglishPanel from "@/components/Laws/PlainEnglishPanel";
import { getLawSection } from "@/lib/api";
import { categoryChipClasses, LAW_CATEGORY_LABELS } from "@/lib/laws";

export const dynamic = "force-dynamic";

interface PageParams {
  lawId: string;
  sectionId: string;
}

interface PageProps {
  params: Promise<PageParams>;
}

// =============================================================================
// Metadata — title + description must come from the same fetch the page
// renders so the OpenGraph card matches what the reader sees.
// =============================================================================

export async function generateMetadata(
  { params }: PageProps,
): Promise<Metadata> {
  const { lawId, sectionId } = await params;
  const section = await getLawSection(lawId, sectionId);
  if (!section) {
    return {
      title: "Section not found — The Record",
    };
  }

  const title = `${section.section_number} · ${section.section_title} — ${section.law.short_name}`;
  return {
    title,
    description: section.plain_english.slice(0, 200),
    alternates: {
      canonical: `https://therecord.co.za/laws/${lawId}/${sectionId}`,
    },
    openGraph: {
      type: "article",
      siteName: "The Record",
      locale: "en_ZA",
      title,
      description: section.plain_english.slice(0, 240),
    },
  };
}

// =============================================================================
// Page
// =============================================================================

export default async function LawSectionPage({ params }: PageProps) {
  const { lawId, sectionId } = await params;
  const section = await getLawSection(lawId, sectionId);
  if (!section) {
    notFound();
  }

  const chip = categoryChipClasses(section.law.category);

  return (
    <article className="bg-cream">
      {/* ----------------------------------------------------------------- */}
      {/* Header — breadcrumb + section title + parent law metadata.        */}
      {/* ----------------------------------------------------------------- */}
      <header className="border-b border-charcoal/10">
        <div className="max-w-4xl mx-auto px-4 md:px-8 pt-8 md:pt-14 pb-8 md:pb-12">
          <Breadcrumb
            lawId={lawId}
            lawShortName={section.law.short_name}
            sectionNumber={section.section_number}
          />

          <div className="mt-6 md:mt-8 flex flex-col gap-3 md:gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-legal-blue text-[12px] md:text-[13px] uppercase tracking-[0.15em]">
                {section.section_number}
              </span>
              <span
                className={`font-mono text-[10px] uppercase tracking-[0.16em] border ${chip.bg} ${chip.text} ${chip.border} rounded-full px-2.5 py-1`}
              >
                {LAW_CATEGORY_LABELS[section.law.category]}
              </span>
            </div>

            <h1 className="font-serif text-[28px] md:text-[40px] leading-[1.1] text-charcoal">
              {section.section_title}
            </h1>

            <p className="font-mono text-[12px] md:text-[13px] text-charcoal/55">
              {section.law.name}
              <span className="text-charcoal/30"> · </span>
              Act {section.law.act_number}
            </p>

            {section.law.full_text_url ? (
              <a
                href={section.law.full_text_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.14em] text-[10px] md:text-[11px] text-legal-blue hover:text-amber transition-colors mt-1 self-start"
              >
                Full Act (PDF)
                <span aria-hidden>↗</span>
              </a>
            ) : null}
          </div>
        </div>
      </header>

      {/* ----------------------------------------------------------------- */}
      {/* Body — plain-English panel, legal-text collapsible, applied-in.   */}
      {/* ----------------------------------------------------------------- */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-8 md:gap-10">
        <PlainEnglishPanel
          plainEnglish={section.plain_english}
          fullText={section.full_text}
        />

        <LegalTextCollapse fullText={section.full_text} />

        <AppliedIn
          commissions={section.commissions}
          adhocCommittees={section.adhoc_committees}
          stories={section.stories}
          siuProclamations={section.siu_proclamations ?? []}
        />

        <BackToLawList />
      </div>
    </article>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface BreadcrumbProps {
  lawId: string;
  lawShortName: string;
  sectionNumber: string;
}

function Breadcrumb({ lawId, lawShortName, sectionNumber }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="font-mono text-[11px] md:text-[12px] uppercase tracking-[0.15em] text-charcoal/50"
    >
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <li>
          <Link
            href="/laws"
            className="hover:text-amber transition-colors focus:outline-none focus-visible:underline"
          >
            Laws
          </Link>
        </li>
        <li aria-hidden className="text-charcoal/30">
          ›
        </li>
        <li>
          <Link
            href={`/laws#${lawId}`}
            className="hover:text-amber transition-colors focus:outline-none focus-visible:underline"
          >
            {lawShortName}
          </Link>
        </li>
        <li aria-hidden className="text-charcoal/30">
          ›
        </li>
        <li className="text-charcoal/75" aria-current="page">
          {sectionNumber}
        </li>
      </ol>
    </nav>
  );
}

function BackToLawList() {
  return (
    <div className="border-t border-charcoal/10 pt-6 md:pt-8">
      <Link
        href="/laws"
        className="inline-flex items-center gap-2 font-mono text-[11px] md:text-[12px] uppercase tracking-[0.16em] text-charcoal/55 hover:text-amber transition-colors focus:outline-none focus-visible:underline"
      >
        <span aria-hidden>←</span>
        Back to all laws
      </Link>
    </div>
  );
}
