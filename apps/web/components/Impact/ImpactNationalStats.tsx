"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

import { formatRands } from "@/lib/format";

import type { NationalStats } from "@the-record/shared-types";

function StatCell({
  display,
  label,
  isPercent,
  reduce,
}: {
  display: number;
  label: string;
  isPercent?: boolean;
  reduce: boolean;
}) {
  const mv = useMotionValue(reduce ? display : 0);
  const spring = useSpring(mv, { stiffness: 100, damping: 22 });
  const [shown, setShown] = useState(reduce ? display : 0);

  useEffect(() => {
    mv.set(display);
  }, [display, mv]);

  useEffect(() => {
    return spring.on("change", (v) => {
      setShown(isPercent ? Math.round(v * 10) / 10 : Math.round(v));
    });
  }, [spring, isPercent]);

  useEffect(() => {
    if (reduce) setShown(display);
  }, [reduce, display, isPercent]);

  const formatted = isPercent
    ? `${shown.toFixed(1)}%`
    : shown.toLocaleString("en-ZA");

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-4 text-center">
      <p className="font-serif text-2xl tabular-nums text-amber sm:text-[26px]">{formatted}</p>
      <p className="mt-1.5 font-sans text-[13px] leading-snug text-cream/60">{label}</p>
    </div>
  );
}

function WaterLossCell({ rands, reduce }: { rands: number; reduce: boolean }) {
  const mv = useMotionValue(reduce ? rands : 0);
  const spring = useSpring(mv, { stiffness: 90, damping: 24 });
  const [shown, setShown] = useState(reduce ? rands : 0);

  useEffect(() => {
    mv.set(rands);
  }, [rands, mv]);

  useEffect(() => {
    return spring.on("change", (v) => setShown(Math.round(v)));
  }, [spring]);

  useEffect(() => {
    if (reduce) setShown(rands);
  }, [reduce, rands]);

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-4 text-center">
      <p className="font-serif text-2xl tabular-nums text-amber sm:text-[26px]">
        {formatRands(shown, { compact: true })}
      </p>
      <p className="mt-1.5 font-sans text-[13px] leading-snug text-cream/60">
        Water lost every year
      </p>
    </div>
  );
}

export default function ImpactNationalStats({ stats }: { stats: NationalStats }) {
  const reduce = useReducedMotion() ?? false;

  return (
    <motion.section
      className="border-y border-white/[0.06] bg-charcoal py-10 md:py-12"
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: reduce ? 0 : 0.45 }}
    >
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <h2 className="sr-only">National context</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <StatCell
            display={stats.poverty_headcount}
            label="People below poverty line"
            reduce={reduce}
          />
          <StatCell
            display={stats.unemployment_expanded}
            label="Expanded unemployment"
            isPercent
            reduce={reduce}
          />
          <StatCell
            display={stats.housing_backlog}
            label="Waiting for a home"
            reduce={reduce}
          />
          <WaterLossCell rands={stats.water_loss_rands_annual} reduce={reduce} />
        </div>
      </div>
    </motion.section>
  );
}
