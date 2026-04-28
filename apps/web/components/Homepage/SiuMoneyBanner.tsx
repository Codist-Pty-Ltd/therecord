import Link from "next/link";

import { formatRands } from "@/lib/format";

import type { SiuStats } from "@the-record/shared-types";

export interface SiuMoneyBannerProps {
  stats: SiuStats | null;
}

export default function SiuMoneyBanner({ stats }: SiuMoneyBannerProps) {
  const lit = stats
    ? formatRands(stats.total_civil_litigation_rands)
    : "N/A";
  const rec = stats ? formatRands(stats.total_recovered_rands) : "N/A";
  const prev = stats ? formatRands(stats.total_prevented_rands) : "N/A";
  const active =
    stats?.active_proclamations_count != null
      ? String(stats.active_proclamations_count)
      : "—";

  return (
    <section
      id="siu-anchor"
      className="relative overflow-hidden bg-[#1a1a1f] text-cream border-t border-white/[0.06]"
    >
      <p
        className="pointer-events-none absolute right-4 top-2 font-serif text-[100px] leading-none text-cream/[0.04] select-none"
        aria-hidden
      >
        SIU
      </p>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber/[0.07] via-transparent to-transparent" />
      <div className="relative z-[1] max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-14">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber">
          Special Investigating Unit · The Money Trail
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4 md:gap-6">
          <div className="rounded border border-white/[0.06] bg-black/20 p-4">
            <p className="font-serif text-xl text-amber md:text-2xl">{lit}</p>
            <p className="mt-1 font-sans text-xs text-cream/55">
              Enrolled in Special Tribunal
            </p>
          </div>
          <div className="rounded border border-white/[0.06] bg-black/20 p-4">
            <p className="font-serif text-xl text-amber md:text-2xl">{rec}</p>
            <p className="mt-1 font-sans text-xs text-cream/55">Cash recovered</p>
          </div>
          <div className="rounded border border-white/[0.06] bg-black/20 p-4">
            <p className="font-serif text-xl text-amber md:text-2xl">{prev}</p>
            <p className="mt-1 font-sans text-xs text-cream/55">
              Future losses prevented
            </p>
          </div>
          <div className="rounded border border-white/[0.06] bg-black/20 p-4">
            <p className="font-serif text-xl text-amber md:text-2xl">{active}</p>
            <p className="mt-1 font-sans text-xs text-cream/55">Active proclamations</p>
          </div>
        </div>
        <div className="mt-8">
          <Link
            href="/siu"
            className="inline-flex min-h-[44px] items-center font-mono text-[11px] uppercase tracking-[0.18em] text-amber hover:text-cream"
          >
            View all proclamations →
          </Link>
        </div>
      </div>
    </section>
  );
}
