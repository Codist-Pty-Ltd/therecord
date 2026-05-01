"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";

export interface SoeHealthScoreBarProps {
  score: number | null;
  className?: string;
}

function barColor(score: number): string {
  if (score >= 70) return "bg-timeline-green";
  if (score >= 40) return "bg-amber";
  return "bg-charge-red";
}

export default function SoeHealthScoreBar({ score, className }: SoeHealthScoreBarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion() ?? false;

  if (score == null) {
    return (
      <div className={className}>
        <div className="h-2 w-full rounded-full bg-charcoal/10" aria-hidden />
        <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-charcoal/45">
          No editorial health score yet
        </p>
      </div>
    );
  }

  const pct = Math.min(100, Math.max(0, score));
  const widthTarget = reduceMotion ? pct : inView ? pct : 0;

  return (
    <div ref={ref} className={className}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-charcoal/55">
          Editorial health score
        </span>
        <span className="font-mono tabular-nums text-sm text-charcoal">{score}/100</span>
      </div>
      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-charcoal/10">
        <motion.div
          className={`h-full rounded-full ${barColor(score)}`}
          initial={{ width: reduceMotion ? `${pct}%` : 0 }}
          animate={{ width: `${widthTarget}%` }}
          transition={{ duration: reduceMotion ? 0 : 0.85, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
