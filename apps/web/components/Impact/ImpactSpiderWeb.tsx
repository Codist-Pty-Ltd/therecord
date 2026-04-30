"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { ImpactConnection, ImpactWebSectorNode } from "@the-record/shared-types";

const MOBILE = { size: 320, radius: 120 };
const DESKTOP = { size: 500, radius: 200 };

export interface ImpactSpiderWebProps {
  sectors: ImpactWebSectorNode[];
  connections: ImpactConnection[];
}

function scrollToSector(slug: string): void {
  const id = `sector-${slug}`;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", `#${id}`);
}

export default function ImpactSpiderWeb({
  sectors,
  connections,
}: ImpactSpiderWebProps) {
  const reduce = useReducedMotion() ?? false;
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [layout, setLayout] = useState<typeof MOBILE>(MOBILE);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setLayout(mq.matches ? DESKTOP : MOBILE);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const ordered = useMemo(
    () => [...sectors].sort((a, b) => a.slug.localeCompare(b.slug)),
    [sectors],
  );

  const slugSet = useMemo(() => new Set(ordered.map((s) => s.slug)), [ordered]);

  const nodePositions = useMemo(() => {
    const { size, radius } = layout;
    const cx = size / 2;
    const cy = size / 2;
    const n = ordered.length;
    return ordered.map((sector, index) => {
      const angle = (index / n) * 2 * Math.PI - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      return { sector, x, y, cx, cy, size };
    });
  }, [ordered, layout]);

  const crossPaths = useMemo(() => {
    const bySlug = new Map(nodePositions.map((p) => [p.sector.slug, p]));
    const out: { d: string; key: string; note: string }[] = [];
    for (const c of connections) {
      if (!slugSet.has(c.from_sector) || !slugSet.has(c.to_sector)) continue;
      const a = bySlug.get(c.from_sector);
      const b = bySlug.get(c.to_sector);
      if (!a || !b) continue;
      out.push({
        key: `${c.from_sector}-${c.to_sector}`,
        d: `M ${a.x} ${a.y} L ${b.x} ${b.y}`,
        note: c.connection_note,
      });
    }
    return out;
  }, [connections, nodePositions, slugSet]);

  const syncHash = useCallback(() => {
    const raw = window.location.hash.replace(/^#/, "");
    const m = /^sector-(.+)$/.exec(raw);
    setActiveSlug(m ? m[1] : null);
  }, []);

  useEffect(() => {
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [syncHash]);

  const lineTransition = reduce
    ? { duration: 0 }
    : { duration: 1.1, ease: [0.22, 1, 0.36, 1] as const };

  const first = nodePositions[0];
  if (!first) return null;

  const { cx, cy, size } = first;

  return (
    <div
      className="relative mx-auto w-full max-w-[500px] md:max-w-none"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="absolute inset-0 overflow-visible"
        aria-hidden
      >
        {crossPaths.map((p, i) => (
          <motion.path
            key={p.key}
            d={p.d}
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
            strokeDasharray="4 6"
            className="text-charcoal/25"
            initial={reduce ? { pathLength: 1, opacity: 0.35 } : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.35 }}
            transition={{ ...lineTransition, delay: reduce ? 0 : 0.45 + i * 0.02 }}
          />
        ))}
        {nodePositions.map(({ sector, x, y }, i) => (
          <motion.path
            key={`spoke-${sector.slug}`}
            d={`M ${cx} ${cy} L ${x} ${y}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="text-amber/55"
            initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ ...lineTransition, delay: reduce ? 0 : i * 0.06 }}
          />
        ))}
      </svg>

      {/* Center */}
      <motion.div
        className="absolute flex flex-col items-center justify-center rounded-full border-2 border-amber bg-charcoal text-center shadow-md"
        style={{
          width: layout.radius > 150 ? 88 : 72,
          height: layout.radius > 150 ? 88 : 72,
          left: cx,
          top: cy,
          marginLeft: -(layout.radius > 150 ? 44 : 36),
          marginTop: -(layout.radius > 150 ? 44 : 36),
        }}
        initial={reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: reduce ? 0 : 0.85, duration: reduce ? 0 : 0.45 }}
      >
        <span className="font-mono text-[8px] uppercase tracking-widest text-amber/90">
          You
        </span>
        <span className="mt-0.5 max-w-[5.5rem] px-1 font-serif text-[10px] leading-tight text-cream md:text-[11px]">
          The common South African
        </span>
      </motion.div>

      {nodePositions.map(({ sector, x, y }, i) => {
        const active = activeSlug === sector.slug;
        const w = active ? 118 : 100;
        const isDesktop = layout.size >= 500;
        const boxHalf = w / 2;
        return (
          <motion.button
            key={sector.slug}
            type="button"
            title={sector.name}
            onClick={() => {
              setActiveSlug(sector.slug);
              scrollToSector(sector.slug);
            }}
            className={[
              "absolute flex flex-col items-center justify-center rounded-xl border px-1.5 py-2 text-center transition-colors",
              active
                ? "border-amber bg-amber/15 z-10"
                : "border-charcoal/15 bg-cream/95 z-[1] hover:border-amber/40",
            ].join(" ")}
            style={{
              width: w,
              left: x,
              top: y,
              marginLeft: -boxHalf,
              marginTop: -40,
            }}
            initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: reduce ? 0 : 1.05 + i * 0.05,
              duration: reduce ? 0 : 0.35,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <span className="text-lg leading-none">{sector.icon ?? "◆"}</span>
            <span
              className={[
                "mt-1 font-serif leading-tight text-charcoal",
                isDesktop ? "text-[12px]" : "text-[11px]",
              ].join(" ")}
            >
              {sector.name}
            </span>
            {sector.stat_value ? (
              <span className="mt-1 font-mono text-[10px] font-medium tabular-nums text-amber">
                {sector.stat_value}
              </span>
            ) : null}
          </motion.button>
        );
      })}
    </div>
  );
}
