"use client";

import { formatRands } from "@/lib/format";

import type { SiuStats } from "@the-record/shared-types";

export type ExplorerTab =
  | "commissions"
  | "adhoc"
  | "siu"
  | "people"
  | "laws";

export interface StatsBarProps {
  /** Compact Rand headline for money counter (null when API unavailable). */
  moneyTrackedCompact: string | null;
  commissionTotal: number;
  committeeTotal: number;
  peopleTotal: number;
  /** Aggregate SIU stats (strings are bigint Rands from the API). */
  siuStats: SiuStats | null;
}

function setExplorerTab(tab: ExplorerTab) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ExplorerTab>("home-explorer-set-tab", { detail: tab }),
  );
}

function scrollToId(id: string) {
  const el = document.getElementById(id);
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Clickable four-up grid: scrolls to anchored sections and selects explorer tab.
 */
export default function StatsBar({
  moneyTrackedCompact,
  commissionTotal,
  committeeTotal,
  peopleTotal,
  siuStats,
}: StatsBarProps) {
  const litigation = siuStats?.total_civil_litigation_rands;
  const litStr = formatRands(litigation, { compact: true });
  const moneyLabel = moneyTrackedCompact ?? "—";

  return (
    <div className="bg-charcoal border-t border-white/[0.06]">
      <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-white/[0.06] min-[520px]:grid-cols-3 lg:grid-cols-5">
        <button
          type="button"
          onClick={() => {
            scrollToId("money-counter-anchor");
          }}
          className="min-h-[52px] cursor-pointer px-1 py-3 text-left transition hover:bg-white/[0.04] sm:px-2"
        >
          <p className="font-serif text-[18px] tabular-nums text-amber sm:text-[22px] lg:text-[24px] leading-tight">
            {moneyLabel}
          </p>
          <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.16em] text-cream/40 sm:text-[9px]">
            Money tracked
          </p>
        </button>
        <button
          type="button"
          onClick={() => {
            setExplorerTab("commissions");
            scrollToId("explorer-anchor");
          }}
          className="min-h-[52px] px-1 py-3 text-left transition hover:bg-white/[0.04] sm:px-2 cursor-pointer"
        >
          <p className="font-serif text-[22px] text-amber sm:text-[26px] tabular-nums">
            {commissionTotal.toLocaleString("en-ZA")}
          </p>
          <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.16em] text-cream/40 sm:text-[9px]">
            Commissions
          </p>
        </button>
        <button
          type="button"
          onClick={() => {
            setExplorerTab("adhoc");
            scrollToId("explorer-anchor");
          }}
          className="min-h-[52px] px-1 py-3 text-left transition hover:bg-white/[0.04] sm:px-2 cursor-pointer"
        >
          <p className="font-serif text-[22px] text-amber sm:text-[26px] tabular-nums">
            {committeeTotal.toLocaleString("en-ZA")}
          </p>
          <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.16em] text-cream/40 sm:text-[9px]">
            Ad Hoc
          </p>
        </button>
        <button
          type="button"
          onClick={() => {
            setExplorerTab("siu");
            scrollToId("siu-anchor");
          }}
          className="min-h-[52px] px-1 py-3 text-left transition hover:bg-white/[0.04] sm:px-2 cursor-pointer"
        >
          <p className="font-serif text-[20px] text-amber sm:text-[26px] tabular-nums leading-tight">
            {litStr}
          </p>
          <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.16em] text-cream/40 sm:text-[9px]">
            SIU Litigation
          </p>
        </button>
        <button
          type="button"
          onClick={() => {
            setExplorerTab("people");
            scrollToId("people-anchor");
          }}
          className="min-h-[52px] px-1 py-3 text-left transition hover:bg-white/[0.04] sm:px-2 cursor-pointer"
        >
          <p className="font-serif text-[22px] text-amber sm:text-[26px] tabular-nums">
            {peopleTotal >= 10
              ? `${peopleTotal.toLocaleString("en-ZA")}+`
              : peopleTotal.toLocaleString("en-ZA")}
          </p>
          <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.16em] text-cream/40 sm:text-[9px]">
            Key People
          </p>
        </button>
      </div>
    </div>
  );
}
