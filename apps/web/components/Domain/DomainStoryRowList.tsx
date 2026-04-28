/**
 * Story rows for /domain/[name] — compact, aligned with the explorer list style.
 */

import Link from "next/link";

import StatusBadge from "@/components/ui/StatusBadge";
import { getDomainMeta } from "@/lib/domains";
import type { StorySummary } from "@the-record/shared-types";

export default function DomainStoryRowList({ stories }: { stories: StorySummary[] }) {
  if (stories.length === 0) {
    return (
      <p className="text-sm text-charcoal/55 py-4">No stories in this domain yet.</p>
    );
  }

  return (
    <ul className="divide-y divide-charcoal/10">
      {stories.map((s) => {
        const domain = getDomainMeta(s.domain);
        return (
          <li key={s.id}>
            <Link
              href={`/story/${s.slug}`}
              className="group flex min-h-[48px] items-start justify-between gap-3 py-3 transition hover:bg-amber/[0.04] first:pt-0"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={s.status} />
                  <span className="font-mono text-[10px] text-charcoal/50 uppercase tracking-wider">
                    <span aria-hidden>{domain.icon}</span> {domain.label}
                  </span>
                </div>
                <h3 className="mt-1.5 font-serif text-base text-charcoal group-hover:text-amber transition-colors line-clamp-2">
                  {s.title}
                </h3>
                {s.summary || s.plain_english_summary ? (
                  <p className="mt-1 text-xs text-charcoal/60 line-clamp-2">
                    {s.plain_english_summary ?? s.summary}
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 text-charcoal/35">→</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
