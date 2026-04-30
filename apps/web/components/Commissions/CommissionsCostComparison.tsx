"use client";

/**
 * "By the numbers" — relative cost bars for the commissions index (Commissions tab).
 * Scale: 100% bar width = R1bn (Zondo).
 */

import { motion, useInView, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useMemo, useRef } from "react";

import type { CommissionSummary } from "@the-record/shared-types";

import { formatRandsCompact, formatRandsFull } from "@/lib/commissions";

const MAX_SCALE_RANDS = 1_000_000_000;

interface CommissionsCostComparisonProps {
  commissions: CommissionSummary[];
}

export default function CommissionsCostComparison({
  commissions,
}: CommissionsCostComparisonProps) {
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });
  const prefersReduced = useReducedMotion() ?? false;

  const { known, unknown, totalKnown, knownCount } = useMemo(() => {
    const withCost = commissions.filter(
      (c): c is CommissionSummary & { cost_rands: number } =>
        c.cost_rands != null && c.cost_rands > 0,
    );
    const sortedKnown = [...withCost].sort(
      (a, b) => b.cost_rands - a.cost_rands,
    );
    const noCost = commissions.filter(
      (c) => c.cost_rands == null || c.cost_rands <= 0,
    );
    noCost.sort((a, b) => a.popular_name.localeCompare(b.popular_name));
    const total = sortedKnown.reduce((s, c) => s + c.cost_rands, 0);
    return {
      known: sortedKnown,
      unknown: noCost,
      totalKnown: total,
      knownCount: sortedKnown.length,
    };
  }, [commissions]);

  if (commissions.length === 0) return null;

  return (
    <section
      ref={ref}
      aria-labelledby="by-the-numbers-heading"
      className="border-b border-charcoal/10 bg-cream"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-11">
        <h2
          id="by-the-numbers-heading"
          className="font-serif text-xl md:text-2xl text-charcoal mb-1"
        >
          By the numbers
        </h2>
        <p className="font-sans text-sm text-charcoal/55 mb-6 md:mb-8 max-w-2xl">
          Known inquiry costs in context. Bar width is proportional to{" "}
          <span className="whitespace-nowrap">R1 billion</span> (State Capture
          Commission scale).
        </p>

        <ul className="flex flex-col gap-3 md:gap-3.5" role="list">
          {known.map((c, idx) => {
            const pct = Math.min(100, (c.cost_rands / MAX_SCALE_RANDS) * 100);
            return (
              <li key={c.id}>
                <Link
                  href={`/commissions/${c.slug}`}
                  className="group grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] gap-2 md:gap-4 items-center rounded-lg -mx-2 px-2 py-2 md:py-1 hover:bg-amber/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/40"
                >
                  <span className="font-sans text-sm md:text-[15px] font-medium text-charcoal truncate min-w-0 group-hover:text-amber transition-colors">
                    {c.popular_name}
                  </span>
                  <div className="h-2.5 md:h-3 rounded-full bg-charcoal/10 overflow-hidden min-w-0">
                    <motion.div
                      className="h-full rounded-full bg-amber"
                      initial={prefersReduced ? { width: `${pct}%` } : { width: 0 }}
                      animate={
                        inView
                          ? { width: `${pct}%` }
                          : { width: prefersReduced ? `${pct}%` : 0 }
                      }
                      transition={{
                        duration: prefersReduced ? 0 : 0.55,
                        delay: prefersReduced ? 0 : idx * 0.05,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                  </div>
                  <span className="font-mono text-xs md:text-sm text-charcoal/75 tabular-nums md:text-right whitespace-nowrap">
                    {formatRandsCompact(c.cost_rands)}
                  </span>
                </Link>
              </li>
            );
          })}

          {unknown.map((c, idx) => (
            <li
              key={c.id}
              className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] gap-2 md:gap-4 items-center py-1 text-charcoal/40"
            >
              <span className="font-sans text-sm truncate min-w-0">
                {c.popular_name}
              </span>
              <div className="h-2.5 md:h-3 rounded-full bg-charcoal/[0.06] min-w-0" />
              <motion.span
                className="font-mono text-[11px] md:text-xs uppercase tracking-wide"
                initial={prefersReduced ? { opacity: 0.55 } : { opacity: 0 }}
                animate={
                  inView
                    ? { opacity: 0.55 }
                    : { opacity: prefersReduced ? 0.55 : 0 }
                }
                transition={{
                  delay: prefersReduced ? 0 : (known.length + idx) * 0.05,
                  duration: 0.25,
                }}
              >
                Cost unknown
              </motion.span>
            </li>
          ))}
        </ul>

        {knownCount > 0 ? (
          <p className="mt-8 md:mt-10 font-sans text-sm text-charcoal/65">
            <span className="font-semibold text-charcoal">
              Total known cost across all commissions:{" "}
              {formatRandsFull(totalKnown)}
            </span>
            <br />
            <span className="text-charcoal/55">
              Across {knownCount} commission{knownCount === 1 ? "" : "s"} where
              cost is known.
            </span>
          </p>
        ) : (
          <p className="mt-6 text-sm text-charcoal/50">
            No commission costs have been recorded yet.
          </p>
        )}
      </div>
    </section>
  );
}
