import Link from "next/link";

import type { AdhocCommitteeStoryBrief } from "@the-record/shared-types";

import { formatLongDate } from "@/lib/commissions";

export default function AdhocStoriesStrip({
  stories,
}: {
  stories: AdhocCommitteeStoryBrief[];
}) {
  if (stories.length === 0) {
    return (
      <section
        aria-label="Linked stories"
        className="border-b border-charcoal/10 py-6 md:py-8"
      >
        <h2 className="label-smallcaps text-charcoal/55 mb-2">Linked stories</h2>
        <p className="font-sans text-sm text-charcoal/50">No stories linked yet.</p>
      </section>
    );
  }

  return (
    <section
      aria-label="Linked stories"
      className="border-b border-charcoal/10 py-6 md:py-8"
    >
      <div className="flex items-center justify-between mb-4 md:mb-5">
        <h2 className="label-smallcaps text-charcoal/55">Linked stories</h2>
        <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-charcoal/40">
          {stories.length} {stories.length === 1 ? "story" : "stories"}
        </span>
      </div>

      <div className="-mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto scrollbar-hidden lg:overflow-visible">
        <ul className="flex flex-nowrap lg:flex-wrap gap-3 md:gap-4 pb-2 lg:pb-0">
          {stories.map((s) => (
            <li
              key={s.id}
              className="shrink-0 w-[280px] md:w-[320px] lg:w-auto lg:flex-1 lg:min-w-[280px] lg:max-w-[420px]"
            >
              <Link
                href={`/story/${s.slug}`}
                className="group flex flex-col gap-2 bg-white border border-charcoal/10 rounded-xl p-4 md:p-5 h-full transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(28,28,30,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/40"
              >
                <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-charcoal/45">
                  {s.latest_event_date
                    ? `Latest · ${formatLongDate(s.latest_event_date)}`
                    : "Story"}
                </span>
                <span className="font-serif text-[15px] md:text-base leading-[1.3] text-charcoal group-hover:text-amber transition-colors">
                  {s.title}
                </span>
                {s.summary ? (
                  <span className="font-sans text-[12px] md:text-[13px] text-charcoal/65 leading-relaxed line-clamp-3">
                    {s.summary}
                  </span>
                ) : null}
                <span className="mt-auto inline-flex items-center gap-1 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-amber">
                  Read story
                  <span
                    aria-hidden
                    className="transition-transform group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
