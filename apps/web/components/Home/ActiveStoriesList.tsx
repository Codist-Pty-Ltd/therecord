"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";

import StatusBadge from "@/components/ui/StatusBadge";
import { getDomainMeta } from "@/lib/domains";
import type { StorySummary } from "@the-record/shared-types";

interface ActiveStoriesListProps {
  stories: StorySummary[];
}

/**
 * Vertical list of all active stories. Each row is a full-width tappable link
 * with status badge, title, domain tag, and a "latest event" line. Rows fade
 * in with a scroll-triggered stagger.
 */
export default function ActiveStoriesList({ stories }: ActiveStoriesListProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  if (stories.length === 0) {
    return (
      <section
        aria-labelledby="all-stories-heading"
        className="max-w-6xl mx-auto px-4 md:px-8 py-14 md:py-20"
      >
        <SectionHeader />
        <p className="font-sans text-base text-charcoal/65 mt-10">
          No active stories on the record yet. Check back soon.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="all-stories-heading"
      className="max-w-6xl mx-auto px-4 md:px-8 py-14 md:py-20"
    >
      <SectionHeader count={stories.length} />

      <ol role="list" className="mt-8 md:mt-12 flex flex-col divide-y divide-charcoal/10 border-y border-charcoal/10">
        {stories.map((story, idx) => (
          <StoryRow
            key={story.id}
            story={story}
            index={idx}
            shouldReduceMotion={shouldReduceMotion}
          />
        ))}
      </ol>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Section header
// -----------------------------------------------------------------------------

function SectionHeader({ count }: { count?: number }) {
  return (
    <div className="flex items-end justify-between gap-6 flex-wrap">
      <div className="flex flex-col gap-3 md:gap-4 max-w-2xl">
        <p className="label-smallcaps text-amber">The Record</p>
        <h2
          id="all-stories-heading"
          className="font-serif text-3xl md:text-4xl lg:text-5xl leading-[1.1] tracking-[-0.01em] text-charcoal"
        >
          Active stories on the record
        </h2>
      </div>

      {typeof count === "number" ? (
        <p className="font-mono text-xs md:text-sm uppercase tracking-[0.18em] text-charcoal/45">
          {count} {count === 1 ? "story" : "stories"} active
        </p>
      ) : null}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Story row
// -----------------------------------------------------------------------------

interface StoryRowProps {
  story: StorySummary;
  index: number;
  shouldReduceMotion: boolean;
}

function StoryRow({ story, index, shouldReduceMotion }: StoryRowProps) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2, margin: "0px 0px -80px 0px" });
  const domain = getDomainMeta(story.domain);

  const latestLine = buildLatestLine(story);

  return (
    <motion.li
      ref={ref}
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: shouldReduceMotion ? 0.001 : 0.5,
        delay: shouldReduceMotion ? 0 : index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group"
    >
      <Link
        href={`/story/${story.slug}`}
        className="flex flex-col md:flex-row md:items-center md:gap-8 gap-4 py-6 md:py-8 focus:outline-none focus-visible:bg-amber/5 px-2 md:px-4 -mx-2 md:-mx-4 rounded-sm"
      >
        <div className="flex-1 min-w-0 flex flex-col gap-3 md:gap-4">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <StatusBadge status={story.status} />
            <span className="inline-flex items-center gap-1 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.16em] text-charcoal/55">
              <span aria-hidden>{domain.icon}</span>
              {domain.label}
            </span>
          </div>

          <h3 className="font-serif text-xl md:text-2xl lg:text-[28px] leading-[1.15] text-charcoal group-hover:text-amber transition-colors">
            {story.title}
          </h3>

          {latestLine ? (
            <p className="font-sans text-[14px] md:text-[15px] leading-relaxed text-charcoal/65 line-clamp-2 md:line-clamp-1">
              {latestLine}
            </p>
          ) : null}
        </div>

        <span
          aria-hidden
          className="hidden md:flex w-12 h-12 items-center justify-center rounded-full border border-charcoal/15 text-charcoal/55 group-hover:border-amber group-hover:bg-amber group-hover:text-charcoal transition-colors flex-shrink-0"
        >
          <span className="text-lg">→</span>
        </span>

        <span
          aria-hidden
          className="md:hidden inline-flex items-center gap-2 text-charcoal/55 font-mono text-[11px] uppercase tracking-[0.14em]"
        >
          Read the thread <span>→</span>
        </span>
      </Link>
    </motion.li>
  );
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Constructs the "latest event" one-liner for a row. The API list endpoint
 * gives us a date but not a per-event summary, so we combine the date with
 * the story's plain-English (or editorial) summary for context.
 */
function buildLatestLine(story: StorySummary): string | null {
  const datePart = story.latest_event_date
    ? formatFriendlyDate(story.latest_event_date)
    : null;

  const body = story.plain_english_summary ?? story.summary ?? null;
  if (!datePart && !body) return null;
  if (!body) return `Latest update: ${datePart}`;
  if (!datePart) return body;

  return `Latest update · ${datePart} — ${body}`;
}

function formatFriendlyDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Johannesburg",
  }).format(date);
}
