import type { Story, StoryDomain } from "@the-record/shared-types";

import StaleBadge from "@/components/ui/StaleBadge";
import StatusBadge from "@/components/ui/StatusBadge";

interface StoryHeaderProps {
  story: Pick<
    Story,
    | "title"
    | "status"
    | "domain"
    | "summary"
    | "plain_english_summary"
    | "updated_at"
  >;
}

const DOMAIN_LABELS: Record<StoryDomain, string> = {
  criminal_justice: "Criminal Justice",
  politics: "Politics",
  organised_crime: "Organised Crime",
  business: "Business",
  labour: "Labour",
};

export default function StoryHeader({ story }: StoryHeaderProps) {
  return (
    <header className="flex flex-col gap-5 md:gap-7 py-6 md:py-10 lg:py-12">
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={story.status} />
        <span className="label-smallcaps text-charcoal/55">
          {DOMAIN_LABELS[story.domain] ?? story.domain}
        </span>
        <StaleBadge lastUpdatedAt={story.updated_at} staleThresholdHours={24} />
      </div>

      <h1 className="font-serif text-[32px] md:text-5xl lg:text-[56px] leading-[1.05] tracking-[-0.01em] text-charcoal max-w-4xl">
        {story.title}
      </h1>

      {story.summary ? (
        <p className="font-sans text-base md:text-lg lg:text-xl leading-relaxed text-charcoal/75 max-w-3xl">
          {story.summary}
        </p>
      ) : null}

      {story.plain_english_summary ? (
        <PlainEnglishSummary text={story.plain_english_summary} />
      ) : null}
    </header>
  );
}

/**
 * Always-visible "explain it to me like I'm ten" summary. Distinct from the
 * collapsible PlainEnglishBox used lower in the page — this one is the
 * editorial foundation of the story and must never be hidden behind a toggle.
 */
function PlainEnglishSummary({ text }: { text: string }) {
  return (
    <section
      aria-label="Plain English summary"
      className="relative bg-cream border-l-4 border-amber rounded-r-2xl md:rounded-r-3xl px-5 md:px-7 py-5 md:py-6 max-w-3xl shadow-[inset_0_1px_0_rgba(200,101,27,0.08)]"
    >
      <div className="flex items-center gap-2 mb-3">
        <span aria-hidden className="text-lg md:text-xl leading-none">
          🧒
        </span>
        <span className="label-smallcaps text-amber">
          Plain English · for a 10-year-old
        </span>
      </div>
      <p className="font-serif text-[17px] md:text-xl lg:text-[22px] leading-[1.4] text-charcoal">
        {text}
      </p>
    </section>
  );
}
