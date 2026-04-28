"use client";

import { useMemo } from "react";

export interface StaleBadgeProps {
  lastUpdatedAt: string | null;
  /** Consider stale if no update within this many hours (default: 24). */
  staleThresholdHours?: number;
  /** Override default `title` tooltip (hover). */
  tooltip?: string;
}

/**
 * Subtle callout when editorial content has not been refreshed recently
 * (based on `updated_at` from the API).
 */
const DEFAULT_TOOLTIP =
  "This story has not received new articles recently. Coverage may be incomplete.";

export default function StaleBadge({
  lastUpdatedAt,
  staleThresholdHours = 24,
  tooltip = DEFAULT_TOOLTIP,
}: StaleBadgeProps) {
  const state = useMemo(() => {
    if (lastUpdatedAt == null || lastUpdatedAt === "") {
      return null;
    }
    const t = new Date(lastUpdatedAt).getTime();
    if (Number.isNaN(t)) {
      return null;
    }
    const hoursSince = (Date.now() - t) / 3_600_000;
    const isStale = hoursSince > staleThresholdHours;
    if (!isStale) {
      return null;
    }
    const days = Math.max(1, Math.floor(hoursSince / 24));
    return { days };
  }, [lastUpdatedAt, staleThresholdHours]);

  if (state == null) {
    return null;
  }

  return (
    <span
      className="inline-flex items-center rounded-full border border-amber/40 bg-amber/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-amber"
      title={tooltip}
    >
      Last updated {state.days} {state.days === 1 ? "day" : "days"} ago
    </span>
  );
}
