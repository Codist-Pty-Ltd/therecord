"use client";

/**
 * StoryTimeline — the core UI artefact of The Record.
 *
 * Mobile-first: vertical spine at 24px from the component's left edge.
 * Desktop (lg+): spine runs down the centre, events alternate left/right.
 *
 * Animations (Framer Motion):
 *   1. Spine: on-mount `scaleY` 0→1 draw (0.8s), plus a scroll-driven
 *      gradient-fill line layered on top (`useScroll` + `useTransform`).
 *   2. Items: on-view fade + slide-up, staggered 0.1s by index.
 *      On desktop items also slide in from their respective side.
 *   3. Latest node: CSS keyframe pulse ring (amber), respects
 *      `prefers-reduced-motion`.
 *   4. Card expand/collapse: `AnimatePresence` + auto-height.
 */

import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import type {
  LegalReference,
  TimelineEventType,
  TimelineEventWithReferences,
} from "@the-record/shared-types";

import EmptyState from "@/components/ui/EmptyState";
import ConstitutionPanel from "@/components/ui/ConstitutionPanel";
import EventTypeBadge from "@/components/ui/EventTypeBadge";
import LegalPanel from "@/components/ui/LegalPanel";
import PlainEnglishBox, {
  type PlainEnglishLevel,
} from "@/components/ui/PlainEnglishBox";

// -----------------------------------------------------------------------------
// Public props
// -----------------------------------------------------------------------------

export interface StoryTimelineProps {
  events: TimelineEventWithReferences[];
  storySlug: string;
  /**
   * Events strictly before this calendar year use muted spine-adjacent nodes
   * (apartheid-era history on the transformation explainer).
   */
  mutedBeforeYear?: number;
  /** When set, timeline plain-English blurbs follow this level instead of `child`. */
  plainEnglishLevel?: PlainEnglishLevel;
  /** Shown beneath the title for the 1994-04-27 first democratic election event. */
  transitionElectionNote?: string;
}

// =============================================================================
// Main component
// =============================================================================

export default function StoryTimeline({
  events,
  storySlug,
  mutedBeforeYear,
  plainEnglishLevel,
  transitionElectionNote,
}: StoryTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion() ?? false;

  // Scroll-driven fill progress. The spine's gradient overlay scales from 0 to
  // 1 as the timeline body passes through the viewport centre.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });
  const fillScaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const latestIndex = useMemo(() => findLatestIndex(events), [events]);

  if (events.length === 0) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 md:px-8">
        <EmptyState
          className="py-12"
          icon="📰"
          heading="Nothing on the timeline yet"
          body="This story has no events in The Record yet—when reporting is linked, they will show along the spine."
        />
      </section>
    );
  }

  return (
    <section
      data-story-slug={storySlug}
      aria-label="Story timeline"
      className="w-full max-w-6xl mx-auto px-4 md:px-8"
    >
      <div ref={containerRef} className="relative py-4 md:py-8 lg:py-12">
        <TimelineSpine
          fillScaleY={fillScaleY}
          shouldReduceMotion={shouldReduceMotion}
        />

        <ol className="relative flex flex-col gap-10 md:gap-14 lg:gap-20">
          {events.map((event, idx) => (
            <TimelineItem
              key={event.id}
              event={event}
              index={idx}
              isLatest={idx === latestIndex}
              side={idx % 2 === 0 ? "left" : "right"}
              storySlug={storySlug}
              mutedBeforeYear={mutedBeforeYear}
              plainEnglishLevel={plainEnglishLevel}
              transitionElectionNote={
                transitionElectionNote &&
                event.event_date.startsWith("1994-04-27")
                  ? transitionElectionNote
                  : undefined
              }
            />
          ))}
        </ol>
      </div>
    </section>
  );
}

// =============================================================================
// Spine (background line + scroll-driven gradient fill)
// =============================================================================

interface TimelineSpineProps {
  fillScaleY: MotionValue<number>;
  shouldReduceMotion: boolean;
}

function TimelineSpine({ fillScaleY, shouldReduceMotion }: TimelineSpineProps) {
  const lineTransition = shouldReduceMotion
    ? { duration: 0.001 }
    : { duration: 0.8, ease: "easeOut" as const };
  return (
    <>
      {/* Background line — draws in on mount. */}
      <motion.div
        aria-hidden
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={lineTransition}
        style={{ originY: 0 }}
        className="pointer-events-none absolute top-0 bottom-0 w-0.5 left-6 lg:left-1/2 -translate-x-1/2 bg-charcoal/10 rounded-full"
      />

      {/* Gradient fill — tracks scroll progress. */}
      <motion.div
        aria-hidden
        style={{ scaleY: fillScaleY, originY: 0 }}
        className="pointer-events-none absolute top-0 bottom-0 w-0.5 left-6 lg:left-1/2 -translate-x-1/2 bg-gradient-to-b from-amber via-amber/90 to-legal-blue rounded-full"
      />
    </>
  );
}

// =============================================================================
// Item (list row)
// =============================================================================

type Side = "left" | "right";

interface TimelineItemProps {
  event: TimelineEventWithReferences;
  index: number;
  isLatest: boolean;
  side: Side;
  storySlug: string;
  mutedBeforeYear?: number;
  plainEnglishLevel?: PlainEnglishLevel;
  transitionElectionNote?: string;
}

function TimelineItem({
  event,
  index,
  isLatest,
  side,
  storySlug,
  mutedBeforeYear,
  plainEnglishLevel,
  transitionElectionNote,
}: TimelineItemProps) {
  const liRef = useRef<HTMLLIElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const inView = useInView(liRef, { amount: 0.25, once: true });

  const shouldReduceMotion = useReducedMotion() ?? false;
  const isDesktop = useIsDesktop();

  const [open, setOpen] = useState(false);

  const eventYear = useMemo(
    () => parseInt(event.event_date.slice(0, 4), 10),
    [event.event_date],
  );
  const isMutedHistorical =
    mutedBeforeYear !== undefined &&
    !Number.isNaN(eventYear) &&
    eventYear < mutedBeforeYear;

  const { statutoryRefs, constitutionalRefs } = useMemo(() => {
    const all = event.legal_references ?? [];
    return {
      statutoryRefs: all.filter((r) => !r.is_constitutional),
      constitutionalRefs: all.filter((r) => r.is_constitutional),
    };
  }, [event.legal_references]);

  // Once the card has finished expanding, nudge it fully into view. `nearest`
  // means we only scroll if the card would otherwise be clipped.
  useEffect(() => {
    if (!open || !cardRef.current) return;
    const timer = window.setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 380);
    return () => window.clearTimeout(timer);
  }, [open]);

  const hiddenX = shouldReduceMotion || !isDesktop
    ? 0
    : side === "left"
      ? -48
      : 48;

  const variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20, x: hiddenX },
    visible: { opacity: 1, y: 0, x: 0 },
  } as const;

  const toggle = () => setOpen((v) => !v);

  return (
    <motion.li
      ref={liRef}
      id={`${storySlug}-event-${event.id}`}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={variants}
      transition={{
        duration: shouldReduceMotion ? 0.001 : 0.55,
        delay: shouldReduceMotion ? 0 : index * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative min-h-[48px]"
    >
      {/* Node — absolute, centred on the spine. */}
      <div className="absolute top-0 left-6 -translate-x-1/2 lg:left-1/2 z-10">
        <TimelineNode
          event={event}
          isLatest={isLatest}
          isOpen={open}
          onToggle={toggle}
          isMutedHistorical={isMutedHistorical}
        />
      </div>

      {/*
       * Card.
       * - Mobile:  offset right of the spine+node (full width minus 48px-ish).
       * - Desktop: positioned on this event's side, leaving a gap for the spine.
       */}
      <div
        ref={cardRef}
        className={[
          "ml-14 md:ml-16",
          "lg:ml-0",
          side === "left"
            ? "lg:mr-[calc(50%+2.25rem)]"
            : "lg:ml-[calc(50%+2.25rem)] lg:mr-0",
        ].join(" ")}
      >
        <EventCard
          event={event}
          open={open}
          onToggle={toggle}
          statutoryRefs={statutoryRefs}
          constitutionalRefs={constitutionalRefs}
          plainEnglishLevel={plainEnglishLevel}
          transitionElectionNote={transitionElectionNote}
        />
      </div>
    </motion.li>
  );
}

// =============================================================================
// Node
// =============================================================================

interface TimelineNodeProps {
  event: TimelineEventWithReferences;
  isLatest: boolean;
  isOpen: boolean;
  onToggle: () => void;
  isMutedHistorical: boolean;
}

function TimelineNode({
  event,
  isLatest,
  isOpen,
  onToggle,
  isMutedHistorical,
}: TimelineNodeProps) {
  const bg = isMutedHistorical
    ? "bg-charcoal/40"
    : nodeBgClass(event.event_type);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-label={`${event.title} — ${formatEventDate(event.event_date)}`}
      className={[
        // 48x48 touch target regardless of visual node size.
        "relative flex items-center justify-center h-12 w-12 rounded-full",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-amber/40",
      ].join(" ")}
    >
      {isLatest ? (
        <span
          aria-hidden
          className="absolute h-10 w-10 md:h-12 md:w-12 rounded-full border-2 border-amber animate-record-pulse"
        />
      ) : null}

      <span
        className={[
          "relative flex items-center justify-center",
          // 40px mobile / 48px desktop visual circle.
          "h-10 w-10 md:h-12 md:w-12 rounded-full",
          "border-[3px] border-cream shadow-[0_2px_6px_rgba(28,28,30,0.18)]",
          "transition-transform duration-200 ease-out",
          isOpen ? "scale-110" : "scale-100",
          bg,
        ].join(" ")}
      >
        <span aria-hidden className="text-sm md:text-base leading-none">
          {nodeEmoji(event.event_type)}
        </span>
      </span>
    </button>
  );
}

// =============================================================================
// Card
// =============================================================================

interface EventCardProps {
  event: TimelineEventWithReferences;
  open: boolean;
  onToggle: () => void;
  statutoryRefs: LegalReference[];
  constitutionalRefs: LegalReference[];
  plainEnglishLevel?: PlainEnglishLevel;
  transitionElectionNote?: string;
}

function EventCard({
  event,
  open,
  onToggle,
  statutoryRefs,
  constitutionalRefs,
  plainEnglishLevel,
  transitionElectionNote,
}: EventCardProps) {
  const hasSources = event.source_urls.length > 0;
  const hasDescription = event.description.trim().length > 0;
  const isCritical = event.significance === "critical";

  return (
    <article
      className={[
        "bg-white rounded-xl md:rounded-2xl",
        "border border-charcoal/10",
        "shadow-[0_1px_3px_rgba(28,28,30,0.04)]",
        "overflow-hidden",
        "transition-shadow duration-200",
        open ? "shadow-[0_6px_24px_rgba(28,28,30,0.08)]" : "hover:shadow-[0_4px_14px_rgba(28,28,30,0.06)]",
      ].join(" ")}
    >
      {/* Header — always visible; tap target for the entire card collapse/expand. */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full text-left px-4 md:px-6 py-4 md:py-5 flex flex-col gap-2 md:gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/40 rounded-xl md:rounded-2xl"
      >
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <EventTypeBadge type={event.event_type} />

          <time
            dateTime={event.event_date}
            className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-charcoal/55"
          >
            {formatEventDate(event.event_date)}
          </time>

          {isCritical ? (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-charge-red">
              <span aria-hidden>●</span>
              Critical
            </span>
          ) : null}
        </div>

        <h3 className="font-serif text-[18px] md:text-[22px] lg:text-[24px] leading-[1.25] text-charcoal">
          {event.title}
        </h3>

        {transitionElectionNote ? (
          <p className="font-serif text-sm md:text-base italic text-amber leading-snug">
            {transitionElectionNote}
          </p>
        ) : null}

        {!open ? (
          <span className="mt-0.5 inline-flex items-center gap-1 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-amber">
            Tap to read more
            <span aria-hidden>→</span>
          </span>
        ) : null}
      </button>

      {/* Collapsible body */}
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 md:px-6 pb-4 md:pb-6 flex flex-col gap-4 md:gap-5">
              {hasDescription ? (
                <p className="font-sans text-[15px] md:text-base leading-relaxed text-charcoal/85">
                  {event.description}
                </p>
              ) : null}

              {event.plain_english ? (
                <PlainEnglishBox
                  level={plainEnglishLevel ?? "child"}
                  text={event.plain_english}
                />
              ) : null}

              {statutoryRefs.length > 0 ? (
                <Disclosure
                  label={`Applicable law (${statutoryRefs.length})`}
                  tone="slate"
                >
                  <LegalPanel
                    title="Applicable law"
                    references={statutoryRefs}
                    variant="statutory"
                  />
                </Disclosure>
              ) : null}

              {constitutionalRefs.length > 0 ? (
                <Disclosure
                  label={`Constitution (${constitutionalRefs.length})`}
                  tone="gold"
                >
                  <ConstitutionPanel references={constitutionalRefs} />
                </Disclosure>
              ) : null}

              {hasSources ? <SourcesList urls={event.source_urls} /> : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  );
}

// =============================================================================
// Sources
// =============================================================================

interface SourcesListProps {
  urls: string[];
}

function SourcesList({ urls }: SourcesListProps) {
  return (
    <section className="pt-4 md:pt-5 border-t border-charcoal/5">
      <h4 className="label-smallcaps text-charcoal/55 mb-3 md:mb-4">Sources</h4>
      <ul className="flex flex-col gap-2 md:gap-2.5">
        {urls.map((url, idx) => (
          <li key={`${url}-${idx}`}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 text-[13px] md:text-sm text-legal-blue hover:text-amber transition-colors"
            >
              <span className="underline underline-offset-4 decoration-legal-blue/30 group-hover:decoration-amber">
                Read more at {sourceNameFromUrl(url)}
              </span>
              <span
                aria-hidden
                className="transition-transform group-hover:translate-x-0.5"
              >
                →
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

// =============================================================================
// Disclosure (collapsible wrapper for nested panels)
// =============================================================================

interface DisclosureProps {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  tone?: "slate" | "gold";
}

function Disclosure({
  label,
  children,
  defaultOpen = false,
  tone = "slate",
}: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const toneClass =
    tone === "gold" ? "text-constitutional-gold" : "text-legal-blue";

  return (
    <div className="flex flex-col gap-2 md:gap-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={[
          "self-start inline-flex items-center gap-2",
          "font-mono text-[10px] md:text-[11px] uppercase tracking-[0.2em]",
          "hover:underline underline-offset-4",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/40 rounded",
          toneClass,
        ].join(" ")}
      >
        <span aria-hidden className="text-xs leading-none">
          {open ? "−" : "+"}
        </span>
        {label}
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// Hooks & helpers
// =============================================================================

/**
 * Match a `min-width: 1024px` media query (Tailwind's `lg` breakpoint).
 * Returns `false` on the server and on the first client render, flipping to
 * the real value after mount. Used to enable desktop-only slide-in direction.
 */
function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isDesktop;
}

/** Index of the event with the highest `event_date`. Ties break to the latest. */
function findLatestIndex(events: TimelineEventWithReferences[]): number {
  if (events.length === 0) return -1;
  let latest = 0;
  for (let i = 1; i < events.length; i += 1) {
    if (events[i].event_date >= events[latest].event_date) {
      latest = i;
    }
  }
  return latest;
}

const SAST_LOCALE = "en-ZA";
const SAST_TIMEZONE = "Africa/Johannesburg";

/** Format an ISO date as "6 July 2025" in SAST. Never shows time. */
function formatEventDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat(SAST_LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: SAST_TIMEZONE,
  }).format(date);
}

/**
 * Tailwind background class for a node's coloured disc.
 * Uses literal class names so JIT can pick them up at build time.
 */
function nodeBgClass(type: TimelineEventType): string {
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
    case "resignation":
    case "statement":
      return "bg-charcoal";
    case "other":
    default:
      return "bg-charcoal/60";
  }
}

const NODE_EMOJI: Record<TimelineEventType, string> = {
  incident: "🚨",
  press_conference: "📣",
  arrest: "🔴",
  charge_filed: "📋",
  commission_established: "🏛️",
  hearing: "⚖️",
  judgment: "⚖️",
  suspension: "⏸",
  resignation: "🚪",
  statement: "📝",
  acquittal: "✅",
  other: "📌",
};

function nodeEmoji(type: TimelineEventType): string {
  return NODE_EMOJI[type] ?? "📌";
}

// Publications with canonical, human-readable display names. Anything not in
// this map falls back to a hostname-derived title-case string.
const KNOWN_SOURCES: Record<string, string> = {
  "dailymaverick.co.za": "Daily Maverick",
  "news24.com": "News24",
  "iol.co.za": "IOL",
  "mg.co.za": "Mail & Guardian",
  "timeslive.co.za": "TimesLive",
  "businesslive.co.za": "Business Day",
  "citizen.co.za": "The Citizen",
  "sabcnews.com": "SABC News",
  "enca.com": "eNCA",
  "ewn.co.za": "Eyewitness News",
  "bbc.com": "BBC",
  "reuters.com": "Reuters",
  "aljazeera.com": "Al Jazeera",
  "theguardian.com": "The Guardian",
  "nytimes.com": "New York Times",
  "gov.za": "SA Government",
  "parliament.gov.za": "SA Parliament",
  "concourt.org.za": "Constitutional Court",
  "judiciary.org.za": "Judiciary of SA",
};

function sourceNameFromUrl(url: string): string {
  try {
    const { hostname } = new URL(url);
    const clean = hostname.replace(/^www\./, "").toLowerCase();

    if (KNOWN_SOURCES[clean]) return KNOWN_SOURCES[clean];

    for (const [key, label] of Object.entries(KNOWN_SOURCES)) {
      if (clean.endsWith(key)) return label;
    }

    const base = clean.split(".")[0] ?? clean;
    return base
      .split(/[-_]/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  } catch {
    return "Source";
  }
}
