/**
 * /commissions/[slug] — the detail page for a single commission of inquiry.
 *
 * Server Component. Fetches the full dossier (stories, people, grouped law
 * sections, unified timeline) and — for the "related" section — every
 * sibling commission's detail in parallel so we can compute which
 * commissions share people with this one.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import CommissionCostPanel from "@/components/Resources/CommissionCostPanel";
import CommissionHeader from "@/components/Commissions/CommissionHeader";
import CommissionLaws from "@/components/Commissions/CommissionLaws";
import CommissionOutcome from "@/components/Commissions/CommissionOutcome";
import CommissionPeopleByRole from "@/components/Commissions/CommissionPeopleByRole";
import CommissionPlainEnglish from "@/components/Commissions/CommissionPlainEnglish";
import CommissionStoriesStrip from "@/components/Commissions/CommissionStoriesStrip";
import CommissionTimeline from "@/components/Commissions/CommissionTimeline";
import EnablingLegislationPanel from "@/components/Commissions/EnablingLegislationPanel";
import RelatedCommissions from "@/components/Commissions/RelatedCommissions";
import ReportsSection from "@/components/Resources/ReportsSection";
import RecommendationsSection from "@/components/Resources/RecommendationsSection";
import VideoSection from "@/components/Resources/VideoSection";
import {
  getCommission,
  getRelatedBySamePeople,
  listCommissions,
  listYoutubeVideosForCommission,
} from "@/lib/api";

export const dynamic = "force-dynamic";

/*
 * Next 15 passes `params` as a Promise — it must be awaited in async server
 * components and metadata functions.
 */
interface CommissionDetailParams {
  slug: string;
}

interface CommissionDetailProps {
  params: Promise<CommissionDetailParams>;
}

// -----------------------------------------------------------------------------
// Metadata
// -----------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: CommissionDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const commission = await getCommission(slug);

  if (!commission) {
    return {
      title: "Commission not found — The Record",
      robots: { index: false, follow: false },
    };
  }

  const canonicalUrl = `https://therecord.co.za/commissions/${commission.slug}`;
  const raw =
    commission.reason_summary?.trim() ||
    commission.plain_english_summary?.trim() ||
    "A commission of inquiry tracked on The Record.";
  const description =
    raw.length > 160 ? `${raw.slice(0, 157)}…` : raw;

  return {
    title: commission.popular_name,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: commission.popular_name,
      description,
      url: canonicalUrl,
      siteName: "The Record",
      locale: "en_ZA",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: commission.popular_name,
      description,
    },
  };
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default async function CommissionDetailPage({
  params,
}: CommissionDetailProps) {
  const { slug } = await params;
  const commission = await getCommission(slug);

  if (!commission) {
    notFound();
  }

  // Deduplicate the person IDs before asking the API for overlap — the same
  // individual can appear multiple times here (e.g. Zuma as both implicated
  // and subject_of_inquiry), and we want each person counted once.
  const personIds = Array.from(
    new Set(commission.people.map((p) => p.person_id)),
  );

  // Fetch everything we need for the related section in parallel. The list
  // gives us domain siblings; the overlap call gives us people siblings.
  const [allList, peopleOverlap, youtubeVideos] = await Promise.all([
    listCommissions(1, 100),
    getRelatedBySamePeople(commission.slug, personIds),
    listYoutubeVideosForCommission(commission.id),
  ]);

  const sameDomain = allList.data.filter(
    (c) => c.domain === commission.domain,
  );

  return (
    <article className="bg-cream">
      <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <CommissionHeader commission={commission} />
        <CommissionCostPanel
          cost_rands={commission.cost_rands ?? null}
          total_hearing_days={commission.total_hearing_days ?? null}
          announced_date={commission.announced_date ?? null}
          concluded_date={commission.concluded_date ?? null}
          commissionName={commission.popular_name}
        />
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <div className="pb-6 md:pb-10">
          <CommissionPlainEnglish text={commission.plain_english_summary} />
        </div>
      </div>

      <ReportsSection
        reports={commission.reports ?? []}
        commissionName={commission.popular_name}
      />

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <div className="pb-6 md:pb-10">
          <EnablingLegislationPanel
            enabling_legislation={commission.enabling_legislation}
            constitution_section_invoked={commission.constitution_section_invoked}
            enabling_sections={commission.law_sections.enabling}
          />
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <CommissionStoriesStrip stories={commission.stories} />
      </div>

      <RecommendationsSection
        summary={commission.recommendations_summary}
        commissionName={commission.popular_name}
      />

      {/*
       * Timeline — full-bleed on mobile so the spine gutter matches the
       * story page pixel-for-pixel. The StoryTimeline component handles
       * its own max-width; we only need to break out of the padded shell.
       */}
      <section aria-label="Commission timeline" className="-mx-0">
        <CommissionTimeline
          events={commission.timeline}
          commissionSlug={commission.slug}
        />
      </section>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <CommissionPeopleByRole people={commission.people} />
      </div>

      <VideoSection videos={youtubeVideos} />

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <CommissionOutcome commission={commission} />
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <CommissionLaws lawSections={commission.law_sections} />
      </div>

      <RelatedCommissions
        currentSlug={commission.slug}
        currentDomain={commission.domain}
        sameDomain={sameDomain}
        samePeople={peopleOverlap}
      />
    </article>
  );
}
