"use client";

import type { ExpenditureCounter } from "@the-record/shared-types";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { formatRandsCompact } from "@/lib/format";
import { useCountUp } from "@/lib/hooks/useCountUp";

export interface MoneyCounterProps {
  counter: ExpenditureCounter | null;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}

export default function MoneyCounter({ counter }: MoneyCounterProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const headlineRef = useRef<HTMLDivElement | null>(null);
  const inViewSection = useInView(sectionRef, { once: true, margin: "-12% 0px" });
  const inViewHeadline = useInView(headlineRef, { once: true, margin: "-5% 0px" });
  const reducedMotion = usePrefersReducedMotion();

  const targetTotal = counter?.total_tracked_rands ?? 0;
  const counted = useCountUp(targetTotal, inViewHeadline, 1400, reducedMotion);
  const headlineDisplay = formatRandsCompact(counted);

  const provincesSorted = useMemo(() => {
    if (!counter?.by_province?.length) return [];
    return [...counter.by_province]
      .filter((p) => p.total_rands > 0)
      .sort((a, b) => b.total_rands - a.total_rands);
  }, [counter]);

  const maxProvince = useMemo(
    () => provincesSorted.reduce((m, p) => Math.max(m, p.total_rands), 0),
    [provincesSorted],
  );

  if (!counter) {
    return (
      <section
        id="money-counter-anchor"
        className="border-t border-white/[0.06] bg-[#1a1a1f] text-cream"
      >
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <p className="text-center font-mono text-sm text-cream/45">
            Money tracking data loading…
          </p>
        </div>
      </section>
    );
  }

  const storyCount = counter.story_count;
  const provinceCount = counter.province_count;

  return (
    <section
      ref={sectionRef}
      id="money-counter-anchor"
      className="border-t border-white/[0.06] bg-[#1a1a1f] text-cream"
    >
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div ref={headlineRef} className="text-center">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-amber">
            Public money tracked
          </p>
          <p
            className="mt-3 font-serif text-amber tabular-nums tracking-tight"
            style={{ fontSize: "clamp(2.5rem, 8vw, 4.5rem)", lineHeight: 1.05 }}
          >
            {headlineDisplay}
          </p>
          <p className="mt-4 font-mono text-[11px] text-cream/50">
            across {storyCount.toLocaleString("en-ZA")} stories in{" "}
            {provinceCount.toLocaleString("en-ZA")}{" "}
            {provinceCount === 1 ? "province" : "provinces"}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 border-t border-white/10 pt-10 lg:grid-cols-4 lg:gap-6">
          <BreakdownCell
            amount={counter.total_under_investigation_rands}
            label="Under investigation"
            className="text-amber"
          />
          <BreakdownCell
            amount={counter.total_allegedly_stolen_rands}
            label="Allegedly stolen"
            className="text-charge-red"
          />
          <BreakdownCell
            amount={counter.total_recovered_rands}
            label="Recovered"
            className="text-timeline-green"
          />
          <BreakdownCell
            amount={counter.total_fruitless_wasteful_rands}
            label="Fruitless & wasteful"
            className="text-legal-blue"
          />
        </div>

        <div className="mt-10 rounded-md border border-white/[0.08] border-l-4 border-l-amber bg-black/20 px-4 py-3 md:px-5 md:py-4">
          <p className="font-sans text-sm leading-relaxed text-cream/70">
            Figures reflect amounts under investigation or alleged — not confirmed losses. The
            Record tracks allegations and findings separately. Confirmed recoveries are shown in
            green.
          </p>
        </div>

        {provincesSorted.length > 0 ? (
          <>
            <div className="mt-12 hidden md:block">
              <div className="mb-4 flex items-end justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream/40">
                  By province
                </p>
                <Link
                  href="/provinces"
                  className="font-mono text-[11px] text-amber underline-offset-2 transition hover:underline"
                >
                  View all provinces →
                </Link>
              </div>
              <ul className="space-y-3">
                {provincesSorted.map((p, i) => {
                  const pct =
                    maxProvince > 0 ? Math.max(6, Math.round((p.total_rands / maxProvince) * 100)) : 0;
                  return (
                    <motion.li
                      key={p.slug}
                      className="flex items-center gap-3"
                      initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                      animate={inViewSection ? { opacity: 1, y: 0 } : {}}
                      transition={{
                        delay: reducedMotion ? 0 : 0.05 * i,
                        duration: 0.35,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <span className="w-[120px] shrink-0 truncate font-sans text-sm text-cream/85 md:w-[140px]">
                        {p.province_name}
                      </span>
                      <div className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className="absolute inset-y-0 left-0 rounded-full bg-amber"
                          initial={reducedMotion ? { width: `${pct}%` } : { width: 0 }}
                          animate={inViewSection ? { width: `${pct}%` } : { width: 0 }}
                          transition={{
                            duration: reducedMotion ? 0 : 0.65,
                            delay: reducedMotion ? 0 : 0.08 + i * 0.05,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        />
                      </div>
                      <span className="w-[72px] shrink-0 text-right font-serif text-base tabular-nums text-amber md:w-[88px]">
                        {formatRandsCompact(p.total_rands)}
                      </span>
                    </motion.li>
                  );
                })}
              </ul>
            </div>

            <div className="mt-8 md:hidden">
              <Link
                href="/provinces"
                className="inline-flex font-mono text-[11px] text-amber underline-offset-2 transition hover:underline"
              >
                Province breakdown &amp; view all provinces →
              </Link>
            </div>
          </>
        ) : (
          <div className="mt-10 hidden text-center md:block">
            <Link
              href="/provinces"
              className="font-mono text-[11px] text-amber underline-offset-2 transition hover:underline"
            >
              View all provinces →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function BreakdownCell({
  amount,
  label,
  className,
}: {
  amount: number;
  label: string;
  className: string;
}) {
  return (
    <div>
      <p className={`font-serif text-[26px] leading-none tabular-nums md:text-[28px] ${className}`}>
        {formatRandsCompact(amount)}
      </p>
      <p className="mt-2 font-mono text-[9px] uppercase leading-tight tracking-[0.14em] text-cream/45">
        {label}
      </p>
    </div>
  );
}
