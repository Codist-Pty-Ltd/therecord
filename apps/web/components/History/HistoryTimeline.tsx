"use client";

import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import type { HistoricalEventApi } from "@the-record/shared-types";

import PlainEnglishBox, {
  type PlainEnglishLevel,
} from "@/components/ui/PlainEnglishBox";

import HistoricalEventBadge from "./HistoricalEventBadge";

export interface HistoryTimelineProps {
  events: HistoricalEventApi[];
  /** Slug for stable anchors, e.g. era slug. */
  anchorSlug: string;
  plainEnglishLevel: PlainEnglishLevel;
}

export default function HistoryTimeline({
  events,
  anchorSlug,
  plainEnglishLevel,
}: HistoryTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });
  const fillScaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const latestIndex = useMemo(() => findLatestEventIndex(events), [events]);

  if (events.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Historical timeline"
      className="w-full max-w-6xl mx-auto px-4 md:px-8"
    >
      <div ref={containerRef} className="relative py-4 md:py-8 lg:py-12">
        <TimelineSpine fillScaleY={fillScaleY} shouldReduceMotion={reduce} />
        <ol className="relative flex flex-col gap-10 md:gap-14 lg:gap-20">
          {events.map((event, idx) => (
            <TimelineRow
              key={event.id}
              event={event}
              index={idx}
              isLatest={idx === latestIndex}
              side={idx % 2 === 0 ? "left" : "right"}
              anchorSlug={anchorSlug}
              plainEnglishLevel={plainEnglishLevel}
              shouldReduceMotion={reduce}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}

function TimelineSpine({
  fillScaleY,
  shouldReduceMotion,
}: {
  fillScaleY: MotionValue<number>;
  shouldReduceMotion: boolean;
}) {
  const lineTransition = shouldReduceMotion
    ? { duration: 0.001 }
    : { duration: 0.8, ease: "easeOut" as const };
  return (
    <>
      <motion.div
        aria-hidden
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={lineTransition}
        style={{ originY: 0 }}
        className="pointer-events-none absolute top-0 bottom-0 w-0.5 left-6 lg:left-1/2 -translate-x-1/2 bg-charcoal/10 rounded-full"
      />
      <motion.div
        aria-hidden
        style={{ scaleY: fillScaleY, originY: 0 }}
        className="pointer-events-none absolute top-0 bottom-0 w-0.5 left-6 lg:left-1/2 -translate-x-1/2 bg-gradient-to-b from-amber via-amber/90 to-legal-blue rounded-full"
      />
    </>
  );
}

type Side = "left" | "right";

function TimelineRow({
  event,
  index,
  isLatest,
  side,
  anchorSlug,
  plainEnglishLevel,
  shouldReduceMotion,
}: {
  event: HistoricalEventApi;
  index: number;
  isLatest: boolean;
  side: Side;
  anchorSlug: string;
  plainEnglishLevel: PlainEnglishLevel;
  shouldReduceMotion: boolean;
}) {
  const liRef = useRef<HTMLLIElement>(null);
  const inView = useInView(liRef, { amount: 0.25, once: true });
  const [open, setOpen] = useState(false);
  const isDesktop = useIsDesktop();

  const dateLabel = event.year_display ?? formatHistoryYear(event.year);

  const hiddenX = shouldReduceMotion || !isDesktop
    ? 0
    : side === "left"
      ? -48
      : 48;

  const variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20, x: hiddenX },
    visible: { opacity: 1, y: 0, x: 0 },
  } as const;

  return (
    <motion.li
      ref={liRef}
      id={`history-${anchorSlug}-${event.id}`}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={variants}
      transition={{
        duration: shouldReduceMotion ? 0.001 : 0.55,
        delay: shouldReduceMotion ? 0 : index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative min-h-[48px]"
    >
      <div className="absolute top-0 left-6 -translate-x-1/2 lg:left-1/2 z-10">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={`${event.title} — ${dateLabel}`}
          className={[
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
              "relative flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-full",
              "border-[3px] border-cream shadow-[0_2px_6px_rgba(28,28,30,0.18)]",
              "bg-charcoal/70 transition-transform duration-200 ease-out",
              open ? "scale-110" : "scale-100",
            ].join(" ")}
          >
            <span aria-hidden className="text-sm md:text-base leading-none">
              {event.event_type === "massacre" || event.event_type === "assassination"
                ? "●"
                : "◆"}
            </span>
          </span>
        </button>
      </div>

      <div
        className={[
          "ml-14 md:ml-16",
          "lg:ml-0",
          side === "left"
            ? "lg:mr-[calc(50%+2.25rem)]"
            : "lg:ml-[calc(50%+2.25rem)] lg:mr-0",
        ].join(" ")}
      >
        <article
          className={[
            "bg-white rounded-xl md:rounded-2xl border border-charcoal/10",
            "shadow-[0_1px_3px_rgba(28,28,30,0.04)] overflow-hidden",
            open ? "shadow-[0_6px_24px_rgba(28,28,30,0.08)]" : "",
          ].join(" ")}
        >
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="w-full text-left px-4 md:px-6 py-4 md:py-5 flex flex-col gap-2 md:gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/40"
          >
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <HistoricalEventBadge type={event.event_type} />
              <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-charcoal/55">
                {dateLabel}
              </span>
              {event.significance === "critical" ? (
                <span className="font-mono text-[10px] uppercase tracking-wider text-charge-red">
                  Critical
                </span>
              ) : null}
            </div>
            <h3 className="font-serif text-lg md:text-xl leading-snug text-charcoal">
              {event.title}
            </h3>
            {!open ? (
              <span className="font-mono text-[10px] uppercase tracking-wider text-amber">
                Tap to read more →
              </span>
            ) : null}
          </button>

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
                <div className="px-4 md:px-6 pb-4 md:pb-6 flex flex-col gap-4">
                  <p className="font-sans text-[15px] md:text-base leading-relaxed text-charcoal/85">
                    {event.description}
                  </p>
                  <PlainEnglishBox
                    level={plainEnglishLevel}
                    text={event.plain_english_child}
                  />
                  {event.source_attribution ? (
                    <p className="text-xs md:text-sm italic text-charcoal/60 border-t border-charcoal/5 pt-3">
                      Source: {event.source_attribution}
                    </p>
                  ) : null}
                  <CrossLinks event={event} />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </article>
      </div>
    </motion.li>
  );
}

function CrossLinks({ event }: { event: HistoricalEventApi }) {
  if (!event.related_commission_slug && !event.related_person_id) return null;
  return (
    <div className="flex flex-wrap gap-3 text-sm">
      {event.related_commission_slug ? (
        <Link
          href={`/commissions/${encodeURIComponent(event.related_commission_slug)}`}
          className="text-legal-blue hover:text-amber underline-offset-4"
        >
          Open commission dossier →
        </Link>
      ) : null}
      {event.related_person_id ? (
        <Link
          href={`/person/${event.related_person_id}`}
          className="text-legal-blue hover:text-amber underline-offset-4"
        >
          Open person profile →
        </Link>
      ) : null}
    </div>
  );
}

function formatHistoryYear(y: number): string {
  if (y < 0) return `${Math.abs(y).toLocaleString("en-ZA")} BCE`;
  return String(y);
}

/** Latest = max year; for negative BCE, "larger" still means closer to present. */
function findLatestEventIndex(events: HistoricalEventApi[]): number {
  let best = 0;
  for (let i = 1; i < events.length; i += 1) {
    if (events[i].year > events[best].year) best = i;
  }
  return best;
}

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return isDesktop;
}
