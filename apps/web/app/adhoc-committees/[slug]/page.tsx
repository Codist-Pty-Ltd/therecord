/**
 * /adhoc-committees/[slug] — National Assembly ad hoc committee dossier.
 *
 * Server Component. Mirrors the commission detail structure with
 * committee-specific fields (mandate, enabling provision, law usage groups).
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import AdhocCategorySection from "@/components/AdhocCommittees/AdhocCategorySection";
import AdhocCommitteeHeader from "@/components/AdhocCommittees/AdhocCommitteeHeader";
import AdhocCommitteeTimeline from "@/components/AdhocCommittees/AdhocCommitteeTimeline";
import AdhocEnablingPanel from "@/components/AdhocCommittees/AdhocEnablingPanel";
import AdhocHistoricBanner from "@/components/AdhocCommittees/AdhocHistoricBanner";
import AdhocKeyDatesStrip from "@/components/AdhocCommittees/AdhocKeyDatesStrip";
import AdhocLawsByUsage from "@/components/AdhocCommittees/AdhocLawsByUsage";
import AdhocMandateSection from "@/components/AdhocCommittees/AdhocMandateSection";
import AdhocOutcomeSection from "@/components/AdhocCommittees/AdhocOutcomeSection";
import AdhocPeopleByRole from "@/components/AdhocCommittees/AdhocPeopleByRole";
import AdhocPlainEnglishStack from "@/components/AdhocCommittees/AdhocPlainEnglishStack";
import AdhocRelatedCommission from "@/components/AdhocCommittees/AdhocRelatedCommission";
import AdhocRelatedCommittees from "@/components/AdhocCommittees/AdhocRelatedCommittees";
import AdhocStoriesStrip from "@/components/AdhocCommittees/AdhocStoriesStrip";
import VideoSection from "@/components/Resources/VideoSection";
import {
  getAdhocCommittee,
  listAdhocCommittees,
  listYoutubeVideosForAdhoc,
} from "@/lib/api";

export const dynamic = "force-dynamic";

interface AdhocPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: AdhocPageProps): Promise<Metadata> {
  const { slug } = await params;
  const committee = await getAdhocCommittee(slug);

  if (!committee) {
    return {
      title: "Committee not found — The Record",
      robots: { index: false, follow: false },
    };
  }

  const canonicalUrl = `https://therecord.co.za/adhoc-committees/${committee.slug}`;
  const raw = committee.mandate_summary?.trim() ?? "";
  const description =
    raw.length > 0
      ? raw.length > 160
        ? `${raw.slice(0, 157)}…`
        : raw
      : "An ad hoc parliamentary committee tracked on The Record.";

  return {
    title: committee.popular_name,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "article",
      title: committee.popular_name,
      description,
      url: canonicalUrl,
      siteName: "The Record",
      locale: "en_ZA",
    },
    twitter: {
      card: "summary_large_image",
      title: committee.popular_name,
      description,
    },
  };
}

export default async function AdhocCommitteePage({ params }: AdhocPageProps) {
  const { slug } = await params;
  const [committee, list] = await Promise.all([
    getAdhocCommittee(slug),
    listAdhocCommittees(1, 100),
  ]);

  if (!committee) {
    notFound();
  }

  const youtubeVideos = await listYoutubeVideosForAdhoc(committee.id);

  const relatedSameDomain = list.data.filter(
    (c) => c.slug !== committee.slug && c.domain === committee.domain,
  );

  return (
    <article className="bg-cream">
      <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <AdhocCommitteeHeader committee={committee} />
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <div className="pb-6 md:pb-8">
          <AdhocPlainEnglishStack committee={committee} />
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <AdhocMandateSection committee={committee} />
        <AdhocKeyDatesStrip committee={committee} />
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <div className="pb-6 md:pb-8">
          <AdhocEnablingPanel committee={committee} />
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <AdhocCategorySection committee={committee} />
        <div className="mt-4 md:mt-6">
          <AdhocRelatedCommission committee={committee} />
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <AdhocPeopleByRole people={committee.people} />
      </div>

      <VideoSection videos={youtubeVideos} />

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <AdhocLawsByUsage law_sections={committee.law_sections} />
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <AdhocOutcomeSection committee={committee} />
        <AdhocHistoricBanner slug={committee.slug} />
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <AdhocStoriesStrip stories={committee.stories} />
      </div>

      <section aria-label="Committee timeline" className="-mx-0">
        <AdhocCommitteeTimeline
          events={committee.timeline}
          committeeSlug={committee.slug}
        />
      </section>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <AdhocRelatedCommittees
          currentSlug={committee.slug}
          committees={relatedSameDomain}
        />
      </div>
    </article>
  );
}
