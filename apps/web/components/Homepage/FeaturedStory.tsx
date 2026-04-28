"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { useFocusTrap } from "@/hooks/useFocusTrap";

import { formatEventDate } from "@/lib/format";

import type {
  LegalReference,
  TimelineEventType,
  TimelineEventWithReferences,
} from "@the-record/shared-types";

export interface FeaturedStoryProps {
  title: string;
  /** Child-readable summary — maps from `plain_english_summary` on the story. */
  plainSummary: string;
  slug: string;
  events: TimelineEventWithReferences[];
}

function eventDotClass(type: TimelineEventType): string {
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
    default:
      return "bg-charcoal/60";
  }
}

export default function FeaturedStory({
  title,
  plainSummary,
  slug,
  events,
}: FeaturedStoryProps) {
  const reduced = useReducedMotion();
  const [drawerEvent, setDrawerEvent] = useState<TimelineEventWithReferences | null>(
    null,
  );
  const sheetRef = useRef<HTMLDivElement>(null);
  useFocusTrap(sheetRef, Boolean(drawerEvent));

  useEffect(() => {
    if (!drawerEvent) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerEvent]);

  const lastFour = useMemo(() => {
    const sorted = [...events].sort(
      (a, b) =>
        new Date(b.event_date).getTime() - new Date(a.event_date).getTime(),
    );
    return sorted.slice(0, 4);
  }, [events]);

  return (
    <>
      <section className="bg-charcoal border-y border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-14">
          <div className="rounded-lg border border-white/[0.06] border-l-4 border-l-amber bg-charcoal/40 p-5 md:p-7">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="homepage-live-dot absolute inline-flex h-full w-full rounded-full bg-amber" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber">
                Live
              </span>
            </div>
            <h2 className="mt-4 font-serif text-[clamp(20px,4vw,26px)] leading-tight text-cream">
              {title}
            </h2>
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-cream/80">
              {plainSummary}
            </p>

            {lastFour.length > 0 ? (
              <div className="mt-8">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-cream/45 mb-3">
                  Mini timeline
                </p>
                <ol
                  className="space-y-3 list-none m-0 p-0"
                  aria-label="Story timeline events"
                >
                  {lastFour.map((ev) => (
                    <li key={ev.id}>
                      <button
                        type="button"
                        onClick={() => setDrawerEvent(ev)}
                        className="flex w-full min-h-[48px] items-start gap-3 rounded text-left transition hover:bg-white/[0.04]"
                      >
                        <span
                          className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${eventDotClass(
                            ev.event_type,
                          )}`}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-baseline gap-2">
                            <time
                              dateTime={ev.event_date}
                              className="shrink-0 font-mono text-[10px] text-amber min-w-[72px]"
                            >
                              {formatEventDate(ev.event_date)}
                            </time>
                            <span className="text-xs leading-snug text-cream/75">
                              {ev.title}
                            </span>
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            <div className="mt-6">
              <Link
                href={`/story/${slug}`}
                className="inline-flex min-h-[44px] items-center font-mono text-[11px] uppercase tracking-[0.18em] text-amber/90 hover:text-amber"
              >
                Full timeline · {events.length} events →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {drawerEvent && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50"
            role="dialog"
            aria-modal
            aria-labelledby="drawer-title"
            initial={reduced ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0 }}
            onClick={() => setDrawerEvent(null)}
          >
            <motion.div
              ref={sheetRef}
              initial={reduced ? { y: 0 } : { y: "100%" }}
              animate={{ y: 0 }}
              exit={reduced ? { y: 0 } : { y: "100%" }}
              transition={
                reduced
                  ? { duration: 0.001 }
                  : { type: "tween", duration: 0.22, ease: "easeOut" }
              }
              className="max-h-[75vh] overflow-y-auto rounded-t-2xl bg-cream px-4 pb-8 pt-5 md:px-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto w-full max-w-lg">
                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-charcoal/15" />
                <p
                  id="drawer-title"
                  className="font-mono text-[10px] uppercase tracking-[0.2em] text-charcoal/50"
                >
                  {formatEventDate(drawerEvent.event_date)} · {drawerEvent.event_type}
                </p>
                <h3 className="mt-1 font-serif text-xl text-charcoal">
                  {drawerEvent.title}
                </h3>
                {drawerEvent.plain_english ? (
                  <p className="mt-3 text-sm leading-relaxed text-charcoal/80">
                    {drawerEvent.plain_english}
                  </p>
                ) : null}
                <LawRefsList legalRefs={drawerEvent.legal_references} />
                <button
                  type="button"
                  onClick={() => setDrawerEvent(null)}
                  aria-label="Close"
                  className="mt-6 w-full min-h-[44px] rounded border border-charcoal/15 text-sm text-charcoal hover:bg-charcoal/5"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function LawRefsList({
  legalRefs,
}: {
  legalRefs: LegalReference[] | undefined;
}) {
  if (!legalRefs || legalRefs.length === 0) return null;
  return (
    <ul className="mt-4 space-y-2 border-t border-charcoal/10 pt-4">
      {legalRefs.map((r, i) => (
        <li key={i} className="text-sm text-charcoal/75">
          <span className="font-medium text-charcoal">
            {r.is_constitutional ? "Constitution" : r.short_name} · {r.section}
          </span>
          {r.relevance ? <span> — {r.relevance}</span> : null}
        </li>
      ))}
    </ul>
  );
}
