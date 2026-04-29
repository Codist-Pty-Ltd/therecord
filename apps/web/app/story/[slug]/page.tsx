import type { Metadata } from "next";
import { notFound } from "next/navigation";

import InvestigationsBar from "@/components/Story/InvestigationsBar";
import KeyPeopleStrip from "@/components/Story/KeyPeopleStrip";
import LegalFramework from "@/components/Story/LegalFramework";
import RecentArticles from "@/components/Story/RecentArticles";
import StoryHeader from "@/components/Story/StoryHeader";
import StoryTimeline from "@/components/Timeline/StoryTimeline";
import VideoSection from "@/components/Resources/VideoSection";
import { getStory, listYoutubeVideosForStory } from "@/lib/api";

export const dynamic = "force-dynamic";

/*
 * Next 15 passes `params` as a Promise — it must be awaited in async server
 * components and metadata functions. See the App Router async params docs.
 */
interface StoryPageParams {
  slug: string;
}

interface StoryPageProps {
  params: Promise<StoryPageParams>;
}

// -----------------------------------------------------------------------------
// Metadata
// -----------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: StoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStory(slug);

  if (!story) {
    return {
      title: "Story not found | The Record",
      robots: { index: false, follow: false },
    };
  }

  const title = `${story.title} | The Record`;
  const raw =
    story.plain_english_summary != null && story.plain_english_summary !== ""
      ? story.plain_english_summary
      : (story.summary ?? "");
  const description =
    raw.length > 0
      ? raw.slice(0, 160)
      : "A story tracked on The Record — South African legal intelligence.";

  const canonicalUrl = `https://therecord.co.za/story/${story.slug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: story.created_at,
      url: canonicalUrl,
      siteName: "The Record",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default async function StoryPage({ params }: StoryPageProps) {
  const { slug } = await params;
  const story = await getStory(slug);

  if (!story) {
    notFound();
  }

  const youtubeVideos = await listYoutubeVideosForStory(story.id);

  return (
    <article className="bg-cream">
      {/*
       * Header band — the summary, status, domain and plain-English
       * foundation live here. Full-bleed container so the band sits flush
       * with page gutters.
       */}
      <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <StoryHeader story={story} />
      </div>

      {/* People strip */}
      <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <KeyPeopleStrip people={story.people} />
      </div>

      {/* Investigations */}
      <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <InvestigationsBar investigations={story.investigations} />
      </div>

      {/*
       * Main body — mobile: single column stack (timeline, legal, articles).
       * Desktop (lg+): 3fr/2fr grid with sticky sidebar on the right.
       */}
      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 pb-16 md:pb-24">
        <div className="lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-12 lg:items-start">
          {/* Timeline */}
          <section
            aria-label="Timeline"
            className="lg:col-start-1 -mx-4 md:-mx-8 lg:mx-0"
          >
            <StoryTimeline
              events={story.timeline_events}
              storySlug={story.slug}
            />
          </section>

          {/* Sidebar (mobile renders inline after timeline) */}
          <aside className="lg:col-start-2 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-1 lg:pb-8">
            <div className="flex flex-col gap-0 lg:gap-8">
              <LegalFramework events={story.timeline_events} />
              <RecentArticles articles={story.articles} />
              <VideoSection videos={youtubeVideos} heading="Video resources" />
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
