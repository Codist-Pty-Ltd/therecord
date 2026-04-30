import Link from "next/link";

import StatusBadge from "@/components/ui/StatusBadge";
import { formatRands } from "@/lib/format";
import { storyCategoryLabel } from "@/lib/story-category-labels";
import type { StoryBriefForProvince } from "@the-record/shared-types";

export default function AccountabilityStoryRow({ story }: { story: StoryBriefForProvince }) {
  return (
    <li>
      <Link
        href={`/story/${story.slug}`}
        className="group flex min-h-[52px] items-start justify-between gap-3 py-3.5 transition first:pt-0 hover:bg-amber/[0.04]"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={story.status} />
            {story.story_category ? (
              <span className="inline-flex rounded border border-charcoal/12 bg-cream px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-charcoal/70">
                {storyCategoryLabel(story.story_category)}
              </span>
            ) : null}
            {story.total_amount_rands ? (
              <span className="font-mono text-[10px] text-amber tabular-nums">
                {formatRands(story.total_amount_rands)}
              </span>
            ) : null}
          </div>
          <h3 className="mt-1.5 font-serif text-[17px] leading-snug text-charcoal group-hover:text-amber transition-colors line-clamp-2">
            {story.title}
          </h3>
        </div>
        <span className="shrink-0 self-center text-charcoal/35">→</span>
      </Link>
    </li>
  );
}
