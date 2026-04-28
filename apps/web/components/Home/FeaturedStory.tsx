"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

import type { FeaturedStoryContent } from "@/lib/placeholders";
import { getDomainMeta } from "@/lib/domains";

interface FeaturedStoryProps {
  story: FeaturedStoryContent;
}

/**
 * The "Live Investigation" hero-adjacent block. Full-bleed on mobile with an
 * 8px amber left border. Previews the three most recent timeline events as a
 * compressed vertical strip that draws in on mount.
 */
export default function FeaturedStory({ story }: FeaturedStoryProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const domain = getDomainMeta(story.domain);

  return (
    <section
      aria-label={`Featured story — ${story.title}`}
      className="bg-cream border-l-[8px] border-amber px-5 md:px-10 lg:px-14 py-8 md:py-12 lg:py-14"
    >
      <div className="max-w-4xl flex flex-col gap-6 md:gap-8">
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <span className="inline-flex items-center gap-2 font-mono text-[11px] md:text-xs uppercase tracking-[0.22em] text-amber font-semibold">
            <span
              aria-hidden
              className="relative flex w-2 h-2"
            >
              <span className="absolute inset-0 rounded-full bg-amber animate-ping opacity-70" />
              <span className="relative rounded-full bg-amber w-2 h-2" />
            </span>
            Live Investigation
          </span>

          <span className="label-smallcaps text-charcoal/45">
            {domain.icon} {domain.label}
          </span>
        </div>

        <h2 className="font-serif text-[28px] md:text-4xl lg:text-5xl leading-[1.1] tracking-[-0.01em] text-charcoal">
          {story.title}
        </h2>

        <p className="font-sans text-base md:text-lg leading-relaxed text-charcoal/75 max-w-3xl">
          {story.summary}
        </p>

        <MiniTimeline
          events={story.latest_events}
          shouldReduceMotion={shouldReduceMotion}
        />

        <div>
          <Link
            href={`/story/${story.slug}`}
            className="group inline-flex items-center gap-2 bg-charcoal text-cream rounded-full px-5 md:px-6 py-3 md:py-3.5 font-mono text-[11px] md:text-xs uppercase tracking-[0.18em] hover:bg-amber transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-amber/40"
          >
            Follow this story
            <span
              aria-hidden
              className="transition-transform group-hover:translate-x-0.5"
            >
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Mini timeline (draw-in from top)
// -----------------------------------------------------------------------------

interface MiniTimelineProps {
  events: FeaturedStoryContent["latest_events"];
  shouldReduceMotion: boolean;
}

function MiniTimeline({ events, shouldReduceMotion }: MiniTimelineProps) {
  if (events.length === 0) return null;

  return (
    <div className="relative pt-2 md:pt-3">
      <p className="label-smallcaps text-charcoal/45 mb-4 md:mb-5">
        Latest on the timeline
      </p>

      <ol
        aria-label="Story timeline events"
        className="relative pl-10 md:pl-12 flex flex-col gap-4 md:gap-5"
      >
        {/* Static background spine. */}
        <span
          aria-hidden
          className="pointer-events-none absolute top-1.5 bottom-1.5 left-[11px] md:left-3 w-0.5 bg-charcoal/10 rounded-full"
        />

        {/* Animated fill — draws from top on mount. */}
        <motion.span
          aria-hidden
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{
            duration: shouldReduceMotion ? 0.001 : 0.9,
            delay: shouldReduceMotion ? 0 : 0.25,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ originY: 0 }}
          className="pointer-events-none absolute top-1.5 bottom-1.5 left-[11px] md:left-3 w-0.5 bg-gradient-to-b from-amber to-legal-blue rounded-full"
        />

        {events.map((event, idx) => (
          <motion.li
            key={idx}
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0.001 : 0.5,
              delay: shouldReduceMotion ? 0 : 0.45 + idx * 0.12,
              ease: "easeOut",
            }}
            className="relative"
          >
            {/* Node */}
            <span
              aria-hidden
              className={[
                "absolute top-[3px] -left-10 md:-left-12 w-5 h-5 md:w-6 md:h-6",
                "rounded-full border-2 border-cream shadow-sm",
                "flex items-center justify-center text-[10px] md:text-xs",
                getNodeBg(event.event_type),
              ].join(" ")}
            >
              {idx === 0 ? (
                <span aria-hidden className="text-cream text-[8px] md:text-[10px] leading-none font-bold">
                  ●
                </span>
              ) : null}
            </span>

            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <time
                  dateTime={event.event_date}
                  className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-charcoal/55"
                >
                  {formatShortDate(event.event_date)}
                </time>
                <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.14em] text-charcoal/35">
                  · {eventTypeLabel(event.event_type)}
                </span>
              </div>
              <p className="font-serif text-[15px] md:text-base leading-tight text-charcoal">
                {event.title}
              </p>
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Formatting helpers (mirrors StoryTimeline but tuned for compact display)
// -----------------------------------------------------------------------------

function formatShortDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Johannesburg",
  }).format(date);
}

function getNodeBg(type: FeaturedStoryContent["latest_events"][number]["event_type"]): string {
  switch (type) {
    case "incident":
    case "arrest":
    case "charge_filed":
      return "bg-charge-red";
    case "press_conference":
      return "bg-amber";
    case "commission_established":
    case "hearing":
      return "bg-legal-blue";
    case "judgment":
    case "acquittal":
      return "bg-timeline-green";
    case "suspension":
      return "bg-yellow-400";
    default:
      return "bg-charcoal";
  }
}

function eventTypeLabel(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
