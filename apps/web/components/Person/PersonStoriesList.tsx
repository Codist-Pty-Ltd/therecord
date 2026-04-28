import Link from "next/link";

import EmptyState from "@/components/ui/EmptyState";
import type { PersonStoryAppearance } from "@the-record/shared-types";

interface PersonStoriesListProps {
  personName: string;
  stories: PersonStoryAppearance[];
}

/**
 * "Mentioned in N stories" section. Key figures float to the top (star
 * indicator); everyone else follows in the API-provided order.
 */
export default function PersonStoriesList({
  personName,
  stories,
}: PersonStoriesListProps) {
  if (stories.length === 0) {
    return (
      <section
        aria-label="Story appearances"
        className="border-b border-charcoal/10 py-4 md:py-6"
      >
        <h2 className="label-smallcaps text-charcoal/55 mb-3">
          Story appearances
        </h2>
        <EmptyState
          className="py-8"
          icon="📰"
          heading="No stories list this name yet"
          body={`${personName} does not appear in a story thread on The Record yet—editorial coverage may change that over time.`}
        />
      </section>
    );
  }

  const ordered = [...stories].sort((a, b) => {
    if (a.is_key_figure === b.is_key_figure) return 0;
    return a.is_key_figure ? -1 : 1;
  });

  return (
    <section
      aria-label="Story appearances"
      className="border-b border-charcoal/10 py-8 md:py-12"
    >
      <div className="flex items-end justify-between gap-4 mb-5 md:mb-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="label-smallcaps text-charcoal/55">
            Story appearances
          </h2>
          <p className="font-serif text-[22px] md:text-3xl text-charcoal leading-[1.1]">
            Mentioned in {stories.length}{" "}
            {stories.length === 1 ? "story" : "stories"}
          </p>
        </div>
      </div>

      <ul className="flex flex-col">
        {ordered.map((s, idx) => (
          <StoryRow
            key={s.id}
            story={s}
            isLast={idx === ordered.length - 1}
          />
        ))}
      </ul>
    </section>
  );
}

function StoryRow({
  story,
  isLast,
}: {
  story: PersonStoryAppearance;
  isLast: boolean;
}) {
  return (
    <li className={isLast ? "" : "border-b border-charcoal/10"}>
      <Link
        href={`/story/${story.slug}`}
        className="group flex flex-col md:flex-row md:items-center gap-3 md:gap-6 py-5 md:py-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/40 rounded-sm"
      >
        <div className="md:w-40 md:shrink-0 flex items-center gap-2">
          {story.is_key_figure ? (
            <span
              aria-hidden
              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber text-white text-[11px] font-bold shadow-sm"
              title="Key figure in this story"
            >
              ★
            </span>
          ) : null}
          <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-charcoal/55">
            {story.role_in_story}
          </span>
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <p className="font-serif text-lg md:text-xl leading-snug text-charcoal group-hover:text-amber transition-colors">
            {story.title}
          </p>
          <p className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.16em] text-charcoal/40">
            {story.domain.replace(/_/g, " ")} · {story.status}
          </p>
        </div>

        <span
          aria-hidden
          className="font-mono text-[11px] md:text-xs uppercase tracking-[0.18em] text-charcoal/40 group-hover:text-amber transition-colors"
        >
          Read →
        </span>
      </Link>
    </li>
  );
}
