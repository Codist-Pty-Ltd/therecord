"use client";

import type { HistoricalEventTypeApi } from "@the-record/shared-types";

export interface HistoricalEventBadgeProps {
  type: HistoricalEventTypeApi;
  className?: string;
}

const CONFIG: Record<
  HistoricalEventTypeApi,
  { emoji: string; label: string; className: string }
> = {
  founding: {
    emoji: "🏛️",
    label: "Foundation",
    className: "bg-legal-blue/12 text-legal-blue border-legal-blue/25",
  },
  law_enacted: {
    emoji: "📋",
    label: "Law passed",
    className: "bg-amber/15 text-amber border-amber/30",
  },
  law_repealed: {
    emoji: "✅",
    label: "Law repealed",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
  },
  dispossession: {
    emoji: "⛓️",
    label: "Dispossession",
    className: "bg-charge-red/12 text-charge-red border-charge-red/25",
  },
  resistance: {
    emoji: "✊",
    label: "Resistance",
    className: "bg-[#D4A017]/15 text-[#8B6914] border-[#D4A017]/35",
  },
  massacre: {
    emoji: "🔴",
    label: "Massacre",
    className: "bg-charge-red/12 text-charge-red border-charge-red/25",
  },
  negotiation: {
    emoji: "🤝",
    label: "Negotiation",
    className: "bg-legal-blue/10 text-legal-blue border-legal-blue/20",
  },
  election: {
    emoji: "🗳️",
    label: "Election",
    className: "bg-emerald-50 text-emerald-900 border-emerald-200/90",
  },
  economic: {
    emoji: "💰",
    label: "Economic",
    className: "bg-amber/12 text-amber border-amber/25",
  },
  social: {
    emoji: "🎭",
    label: "Social",
    className: "bg-charcoal/[0.06] text-charcoal border-charcoal/15",
  },
  liberation: {
    emoji: "🌅",
    label: "Liberation",
    className: "bg-emerald-50 text-emerald-900 border-emerald-200/80",
  },
  assassination: {
    emoji: "✝️",
    label: "Assassination",
    className:
      "bg-charge-red/8 text-charge-red/90 border-charge-red/15 opacity-95",
  },
};

export default function HistoricalEventBadge({
  type,
  className,
}: HistoricalEventBadgeProps) {
  const c = CONFIG[type] ?? CONFIG.founding;
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5",
        "font-mono text-[10px] uppercase tracking-wider",
        c.className,
        className ?? "",
      ].join(" ")}
    >
      <span aria-hidden>{c.emoji}</span>
      {c.label}
    </span>
  );
}
