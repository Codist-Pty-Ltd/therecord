/**
 * StatusBadge — pill badge reflecting a story/person status.
 * Server component. Mobile-first: fixed short labels never wrap.
 */

export type StatusBadgeVariant =
  | "active"
  | "resolved"
  | "dormant"
  | "suspended"
  | "charged"
  | "acquitted"
  | "resigned"
  | "unknown";

interface StatusBadgeProps {
  status: StatusBadgeVariant;
  className?: string;
  /** When set, replaces the default label for this variant (e.g. ad hoc committee states). */
  label?: string;
}

interface Variant {
  label: string;
  bg: string;
  text: string;
  dot: string;
}

const VARIANTS: Record<StatusBadgeVariant, Variant> = {
  active: {
    label: "Active",
    bg: "bg-amber",
    text: "text-white",
    dot: "bg-white/90",
  },
  resolved: {
    label: "Resolved",
    bg: "bg-timeline-green",
    text: "text-white",
    dot: "bg-white/90",
  },
  dormant: {
    label: "Dormant",
    bg: "bg-charcoal/15",
    text: "text-charcoal",
    dot: "bg-charcoal/60",
  },
  suspended: {
    label: "Suspended",
    bg: "bg-yellow-300",
    text: "text-charcoal",
    dot: "bg-charcoal/70",
  },
  charged: {
    label: "Charged",
    bg: "bg-charge-red",
    text: "text-white",
    dot: "bg-white/90",
  },
  acquitted: {
    label: "Acquitted",
    bg: "bg-legal-blue",
    text: "text-white",
    dot: "bg-white/90",
  },
  resigned: {
    label: "Resigned",
    bg: "bg-charcoal/12",
    text: "text-charcoal",
    dot: "bg-charcoal/50",
  },
  unknown: {
    label: "Unknown",
    bg: "bg-charcoal/10",
    text: "text-charcoal/75",
    dot: "bg-charcoal/40",
  },
};

export default function StatusBadge({ status, className, label }: StatusBadgeProps) {
  const variant = VARIANTS[status] ?? VARIANTS.unknown;
  const text = label ?? variant.label;

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 whitespace-nowrap",
        "px-2.5 py-0.5 rounded-full",
        "font-mono text-[10px] md:text-[11px] uppercase tracking-[0.14em]",
        "shadow-sm",
        variant.bg,
        variant.text,
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full ${variant.dot}`}
      />
      {text}
    </span>
  );
}
