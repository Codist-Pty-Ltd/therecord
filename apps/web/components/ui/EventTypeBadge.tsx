import type { TimelineEventType } from "@the-record/shared-types";

/**
 * EventTypeBadge — icon + short label for a timeline event type.
 * Server component. Accepts any string so future `event_type` enum values
 * don't break the frontend; unknown types fall back to a neutral style.
 */

interface EventTypeBadgeProps {
  /** Usually a `TimelineEventType`, but loose string is accepted for safety. */
  type: TimelineEventType | string;
  className?: string;
}

interface EventTypeStyle {
  emoji: string;
  label: string;
  bg: string;
  text: string;
}

const EVENT_MAP: Record<string, EventTypeStyle> = {
  incident: {
    emoji: "🚨",
    label: "Incident",
    bg: "bg-charge-red/10",
    text: "text-charge-red",
  },
  press_conference: {
    emoji: "📣",
    label: "Press conference",
    bg: "bg-amber/15",
    text: "text-amber",
  },
  arrest: {
    emoji: "🔴",
    label: "Arrest",
    bg: "bg-charge-red/10",
    text: "text-charge-red",
  },
  charge_filed: {
    emoji: "📋",
    label: "Charge filed",
    bg: "bg-charge-red/10",
    text: "text-charge-red",
  },
  commission_established: {
    emoji: "🏛️",
    label: "Commission established",
    bg: "bg-legal-blue/10",
    text: "text-legal-blue",
  },
  hearing: {
    emoji: "⚖️",
    label: "Hearing",
    bg: "bg-legal-blue/10",
    text: "text-legal-blue",
  },
  judgment: {
    emoji: "⚖️",
    label: "Judgment",
    bg: "bg-timeline-green/15",
    text: "text-timeline-green",
  },
  suspension: {
    emoji: "⏸️",
    label: "Suspension",
    bg: "bg-yellow-100",
    text: "text-yellow-800",
  },
  resignation: {
    emoji: "🚪",
    label: "Resignation",
    bg: "bg-charcoal/10",
    text: "text-charcoal",
  },
  statement: {
    emoji: "📝",
    label: "Statement",
    bg: "bg-charcoal/[0.06]",
    text: "text-charcoal",
  },
  acquittal: {
    emoji: "✅",
    label: "Acquittal",
    bg: "bg-timeline-green/15",
    text: "text-timeline-green",
  },
  other: {
    emoji: "📌",
    label: "Event",
    bg: "bg-charcoal/10",
    text: "text-charcoal",
  },
};

const FALLBACK: EventTypeStyle = {
  emoji: "📌",
  label: "Event",
  bg: "bg-charcoal/10",
  text: "text-charcoal",
};

export default function EventTypeBadge({ type, className }: EventTypeBadgeProps) {
  const entry = EVENT_MAP[type] ?? FALLBACK;

  return (
    <span
      aria-label={`Event type: ${entry.label}`}
      className={[
        "inline-flex items-center gap-1.5 whitespace-nowrap",
        "px-2 py-0.5 md:px-2.5 md:py-1 rounded-md",
        "font-mono text-[10px] md:text-[11px] uppercase tracking-[0.12em]",
        entry.bg,
        entry.text,
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span aria-hidden className="text-[11px] md:text-xs leading-none">
        {entry.emoji}
      </span>
      <span aria-hidden className="uppercase">
        {entry.label}
      </span>
    </span>
  );
}
