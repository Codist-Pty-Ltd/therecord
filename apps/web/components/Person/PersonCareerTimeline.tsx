"use client";

import Link from "next/link";
import { useMemo } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import EventTypeBadge from "@/components/ui/EventTypeBadge";
import {
  COMMISSION_PERSON_ROLE_LABELS,
  extractYear,
  formatLongDate,
} from "@/lib/commissions";
import {
  careerNodeColourClasses,
  classifyEventKind,
  describeCommissionAppearance,
  type CareerTimelineNodeKind,
} from "@/lib/person";

import type {
  PersonCommissionAppearance,
  PersonDetail,
  PersonEventAppearance,
  PersonStoryAppearance,
} from "@the-record/shared-types";

interface PersonCareerTimelineProps {
  person: PersonDetail;
}

/**
 * A single node on the unified career timeline. Comes either from a
 * commission appearance or from a story event — the `kind` field drives
 * node colouring while `source` drives the rendered card body.
 */
type TimelineNode =
  | {
      id: string;
      date: string | null;
      kind: CareerTimelineNodeKind;
      source: { type: "commission"; data: PersonCommissionAppearance };
    }
  | {
      id: string;
      date: string | null;
      kind: CareerTimelineNodeKind;
      source: {
        type: "event";
        data: PersonEventAppearance;
        story: PersonStoryAppearance | null;
      };
    };

/**
 * The signature feature of the person page: one vertical thread that merges
 * every public moment — commission appearances, story events, legal outcomes
 * — into a single chronology. Oldest first. Year rails separate eras.
 *
 * This is a *person's* life thread, not a single story's. Commission
 * appearances are first-class nodes (so the Zondo/Seriti/Hefer row of a
 * Zuma profile is visible without scanning individual story events), and
 * events carry a chip pointing back to the story they came from.
 */
export default function PersonCareerTimeline({
  person,
}: PersonCareerTimelineProps) {
  const prefersReducedMotion = useReducedMotion();

  const storyById = useMemo(() => {
    const map = new Map<string, PersonStoryAppearance>();
    for (const s of person.stories) map.set(s.id, s);
    return map;
  }, [person.stories]);

  const nodes = useMemo<TimelineNode[]>(() => {
    const out: TimelineNode[] = [];

    for (const appearance of person.commissions) {
      out.push({
        id: `commission-${appearance.id}`,
        date: appearance.announced_date ?? appearance.concluded_date,
        kind: "commission",
        source: { type: "commission", data: appearance },
      });
    }

    for (const event of person.events) {
      out.push({
        id: `event-${event.id}`,
        date: event.event_date,
        kind: classifyEventKind(event.event_type),
        source: {
          type: "event",
          data: event,
          story: storyById.get(event.story_id) ?? null,
        },
      });
    }

    /* Oldest → newest. Nulls sink to the bottom (we only use them for
     * commissions with unknown announced/concluded dates, which are rare). */
    out.sort((a, b) => {
      const da = a.date ?? "9999-12-31";
      const db = b.date ?? "9999-12-31";
      return da.localeCompare(db);
    });

    return out;
  }, [person.commissions, person.events, storyById]);

  if (nodes.length === 0) {
    return (
      <section
        aria-label="Career timeline"
        className="border-y border-charcoal/10 py-10 md:py-14"
      >
        <div className="flex flex-col gap-3 max-w-2xl">
          <h2 className="label-smallcaps text-charcoal/55">Career timeline</h2>
          <p className="font-serif text-[22px] md:text-3xl text-charcoal/80 leading-snug">
            No public record yet.
          </p>
          <p className="font-sans text-sm md:text-base text-charcoal/60">
            This person has no commission appearances or story events logged
            on The Record. They&apos;ll appear here as soon as they&apos;re
            named in a story or linked to a commission of inquiry.
          </p>
        </div>
      </section>
    );
  }

  /* Group by year so the rail reads like a chronology, not a flat list. */
  const nodesByYear = groupByYear(nodes);

  return (
    <section
      aria-label="Career timeline"
      className="border-y border-charcoal/10 py-8 md:py-12"
    >
      <div className="flex items-end justify-between gap-4 mb-6 md:mb-8">
        <div className="flex flex-col gap-1.5">
          <h2 className="label-smallcaps text-charcoal/55">Career timeline</h2>
          <p className="font-serif text-[22px] md:text-3xl text-charcoal leading-[1.1]">
            {nodes.length} {nodes.length === 1 ? "moment" : "moments"} on the
            public record
          </p>
        </div>
        <TimelineLegend />
      </div>

      <div className="relative pl-10 md:pl-14">
        <span
          aria-hidden
          className="absolute top-2 bottom-2 left-4 md:left-6 w-px bg-charcoal/15"
        />

        <AnimatePresence initial={false}>
          {nodesByYear.map(({ year, items }, groupIdx) => (
            <motion.div
              key={year}
              layout
              initial={
                prefersReducedMotion ? false : { opacity: 0, y: 12 }
              }
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                delay: prefersReducedMotion ? 0 : groupIdx * 0.04,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mb-10 md:mb-12 last:mb-0"
            >
              <div className="relative -ml-6 md:-ml-8 mb-4 md:mb-5">
                <span
                  aria-hidden
                  className="absolute left-[-0.125rem] md:left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-charcoal"
                />
                <span className="font-mono text-[11px] md:text-xs uppercase tracking-[0.22em] text-charcoal/70 pl-6 md:pl-8">
                  {year}
                </span>
              </div>

              <ol className="flex flex-col gap-6 md:gap-7">
                {items.map((node, idx) => (
                  <TimelineRow
                    key={node.id}
                    node={node}
                    animationIndex={groupIdx * 100 + idx}
                    prefersReducedMotion={Boolean(prefersReducedMotion)}
                  />
                ))}
              </ol>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Row renderer
// -----------------------------------------------------------------------------

interface TimelineRowProps {
  node: TimelineNode;
  animationIndex: number;
  prefersReducedMotion: boolean;
}

function TimelineRow({
  node,
  animationIndex,
  prefersReducedMotion,
}: TimelineRowProps) {
  const colours = careerNodeColourClasses(node.kind);
  /* Only the `dot` class is applied on the node; `text`/`ring` exist for the
   * legend and future decoration respectively. */

  return (
    <motion.li
      layout
      initial={prefersReducedMotion ? false : { opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.3,
        delay: prefersReducedMotion ? 0 : Math.min(animationIndex * 0.02, 0.3),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative"
    >
      <span
        aria-hidden
        className={[
          "absolute top-3 md:top-3.5 -left-[1.4rem] md:-left-[1.95rem]",
          "w-3 h-3 md:w-3.5 md:h-3.5 rounded-full",
          "ring-[4px] ring-cream",
          colours.dot,
        ].join(" ")}
      />

      {node.source.type === "commission" ? (
        <CommissionNode appearance={node.source.data} />
      ) : (
        <EventNode event={node.source.data} story={node.source.story} />
      )}
    </motion.li>
  );
}

function CommissionNode({
  appearance,
}: {
  appearance: PersonCommissionAppearance;
}) {
  const roleLabel = COMMISSION_PERSON_ROLE_LABELS[appearance.role];
  const dateLabel = formatLongDate(appearance.announced_date);

  return (
    <Link
      href={`/commissions/${appearance.slug}`}
      className="group block bg-white/80 hover:bg-white rounded-xl border border-charcoal/10 hover:border-legal-blue/25 transition-colors p-4 md:p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-legal-blue/40"
    >
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap px-2 py-0.5 md:px-2.5 md:py-1 rounded-md font-mono text-[10px] md:text-[11px] uppercase tracking-[0.12em] bg-legal-blue/10 text-legal-blue">
          <span aria-hidden>🏛️</span>
          {roleLabel}
        </span>
        <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-charcoal/45">
          {dateLabel}
        </span>
      </div>

      <p className="font-serif text-lg md:text-xl leading-snug text-charcoal group-hover:text-legal-blue transition-colors">
        {describeCommissionAppearance(appearance)}
      </p>

      {appearance.summary ? (
        <p className="mt-2 font-sans text-sm md:text-[15px] text-charcoal/70 leading-relaxed">
          {appearance.summary}
        </p>
      ) : null}

      <div className="mt-3 flex items-center gap-2 text-charcoal/55 group-hover:text-legal-blue font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] transition-colors">
        Open commission
        <span aria-hidden>→</span>
      </div>
    </Link>
  );
}

function EventNode({
  event,
  story,
}: {
  event: PersonEventAppearance;
  story: PersonStoryAppearance | null;
}) {
  const dateLabel = formatLongDate(event.event_date);

  return (
    <div className="bg-white/80 rounded-xl border border-charcoal/10 p-4 md:p-5">
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <EventTypeBadge type={event.event_type} />
        <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-charcoal/45">
          {dateLabel}
        </span>
      </div>

      <p className="font-serif text-lg md:text-xl leading-snug text-charcoal">
        {event.title}
      </p>

      {story ? (
        <Link
          href={`/story/${story.slug}`}
          className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-charcoal/60 hover:text-amber hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/40 rounded-sm transition-colors"
        >
          <span aria-hidden>↳</span>
          In story: {story.title}
        </Link>
      ) : null}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Legend + grouping helpers
// -----------------------------------------------------------------------------

function TimelineLegend() {
  const items: { kind: CareerTimelineNodeKind; label: string }[] = [
    { kind: "commission", label: "Commission" },
    { kind: "criminal", label: "Criminal" },
    { kind: "legal", label: "Legal" },
    { kind: "story", label: "Story" },
  ];

  return (
    <div className="hidden md:flex items-center gap-4 flex-wrap text-charcoal/50">
      {items.map(({ kind, label }) => {
        const c = careerNodeColourClasses(kind);
        return (
          <span
            key={kind}
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em]"
          >
            <span aria-hidden className={`w-2 h-2 rounded-full ${c.dot}`} />
            {label}
          </span>
        );
      })}
    </div>
  );
}

/**
 * Group timeline nodes by calendar year, preserving the incoming (already
 * chronological) order within each bucket. Unknown-date nodes are bucketed
 * under `"Undated"` and pinned to the end.
 */
function groupByYear(
  nodes: TimelineNode[],
): { year: string; items: TimelineNode[] }[] {
  const groups = new Map<string, TimelineNode[]>();
  for (const node of nodes) {
    const year = node.date ? extractYear(node.date) : "Undated";
    const bucket = groups.get(year) ?? [];
    bucket.push(node);
    groups.set(year, bucket);
  }

  const ordered: { year: string; items: TimelineNode[] }[] = [];
  for (const [year, items] of groups) {
    if (year === "Undated") continue;
    ordered.push({ year, items });
  }
  ordered.sort((a, b) => a.year.localeCompare(b.year));

  const undated = groups.get("Undated");
  if (undated) ordered.push({ year: "Undated", items: undated });

  return ordered;
}
