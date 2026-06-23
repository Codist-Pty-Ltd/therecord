"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { computeMoneyToReality } from "@/lib/money-to-reality";
import { useMoneyToReality } from "@/hooks/useMoneyToReality";

const SLIDER_MIN = 1_000_000;
const SLIDER_MAX = 100_000_000_000;

function logSliderToValue(p: number): number {
  const l0 = Math.log10(SLIDER_MIN);
  const l1 = Math.log10(SLIDER_MAX);
  return Math.round(10 ** (l0 + p * (l1 - l0)));
}

function valueToLogSlider(n: number): number {
  const v = Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, n));
  const l0 = Math.log10(SLIDER_MIN);
  const l1 = Math.log10(SLIDER_MAX);
  return (Math.log10(v) - l0) / (l1 - l0);
}

type Preset = {
  id: string;
  label: string;
  rands: number;
  storySlug?: string;
  storyHref?: string;
  storyLabel: string;
};

const PRESETS: Preset[] = [
  {
    id: "mpumalanga-schools",
    label: "R114m Mpumalanga schools",
    rands: 114_000_000,
    storySlug: "mpumalanga-school-tender-fraud-2026",
    storyLabel: "Mpumalanga school tender case",
  },
  {
    id: "malusi-booi-housing",
    label: "R1bn Malusi Booi housing",
    rands: 1_000_000_000,
    storySlug: "malusi-booi-housing-tender-fraud-2023",
    storyLabel: "Malusi Booi housing fraud case",
  },
  {
    id: "water-losses",
    label: "R19bn Water losses",
    rands: 19_000_000_000,
    storySlug: "water-sector-r19bn-losses-2023-24",
    storyLabel: "National water-sector losses",
  },
  {
    id: "state-capture",
    label: "R1 trillion State Capture",
    rands: 1_000_000_000_000,
    storyHref: "/commissions/zondo-commission-state-capture",
    storyLabel: "Zondo Commission — state capture scale",
  },
];

const PRESET_BY_ID = new Map(PRESETS.map((p) => [p.id, p] as const));

function formatRandsLong(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "R0";
  if (n >= 1_000_000_000_000) {
    const t = n / 1_000_000_000_000;
    return `R${t % 1 === 0 ? t.toFixed(0) : t.toFixed(1)} trillion`;
  }
  if (n >= 1_000_000_000) {
    const b = n / 1_000_000_000;
    return `R${b % 1 === 0 ? b.toFixed(0) : b.toFixed(1)} billion`;
  }
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `R${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)} million`;
  }
  return `R${n.toLocaleString("en-ZA")}`;
}

function CountCell({
  label,
  value,
  reduce,
}: {
  label: string;
  value: number;
  reduce: boolean;
}) {
  const mv = useMotionValue(reduce ? value : 0);
  const spring = useSpring(mv, { stiffness: 120, damping: 20 });
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    mv.set(value);
  }, [value, mv]);

  useEffect(() => {
    return spring.on("change", (v) => setDisplay(Math.round(v)));
  }, [spring]);

  useEffect(() => {
    if (reduce) setDisplay(value);
  }, [reduce, value]);

  return (
    <motion.div
      className="rounded-xl border border-charcoal/10 bg-cream px-3 py-3 shadow-sm"
      layout
    >
      <p className="font-serif text-2xl tabular-nums text-amber md:text-[28px]">
        {display.toLocaleString("en-ZA")}
      </p>
      <p className="mt-1 text-xs leading-snug text-charcoal/70">{label}</p>
    </motion.div>
  );
}

export interface MoneyCalculatorProps {
  initialAmountRands?: number;
  initialStoryKey?: string;
}

export default function MoneyCalculator({
  initialAmountRands,
  initialStoryKey,
}: MoneyCalculatorProps) {
  const reduce = useReducedMotion() ?? false;

  const [amount, setAmount] = useState(() => {
    if (
      initialAmountRands != null &&
      Number.isFinite(initialAmountRands) &&
      initialAmountRands > 0
    ) {
      return Math.floor(initialAmountRands);
    }
    if (initialStoryKey) {
      const pr = PRESET_BY_ID.get(initialStoryKey);
      if (pr) return pr.rands;
    }
    return 114_000_000;
  });
  const [inputText, setInputText] = useState("");
  const [activePresetId, setActivePresetId] = useState<string | null>(
    initialStoryKey && PRESET_BY_ID.has(initialStoryKey) ? initialStoryKey : null,
  );

  const { data: effective = computeMoneyToReality(amount) } =
    useMoneyToReality(amount);

  const sliderPos = valueToLogSlider(Math.min(SLIDER_MAX, Math.max(amount, SLIDER_MIN)));

  const applyPreset = useCallback((p: Preset) => {
    setAmount(p.rands);
    setInputText("");
    setActivePresetId(p.id);
  }, []);

  const onShare = useCallback(() => {
    const q = new URLSearchParams();
    q.set("amount", String(Math.floor(amount)));
    if (activePresetId) q.set("story", activePresetId);
    const path = `/impact?${q.toString()}`;
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://therecord.co.za";
    const full = `${origin}${path}`;
    void navigator.clipboard.writeText(full).catch(() => {});
  }, [amount, activePresetId]);

  return (
    <section className="rounded-2xl border border-amber/25 bg-charcoal px-4 py-8 md:px-8 md:py-10 text-cream">
      <h2 className="font-serif text-[22px] text-cream md:text-[26px]">
        Money to reality
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-cream/65">
        Enter an amount of stolen public money. The calculator shows what that scale could
        have funded — using the same unit costs as our editorial impact layer.
      </p>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-widest text-amber/90">
            Amount (R)
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={inputText || (Number.isFinite(amount) ? String(amount) : "")}
            onChange={(e) => {
              const raw = e.target.value.replace(/\s/g, "").replace(/,/g, "");
              setInputText(raw);
              setActivePresetId(null);
              if (/^\d+$/.test(raw)) {
                const n = Number(raw);
                if (n > 0) setAmount(Math.min(n, Number.MAX_SAFE_INTEGER));
              }
            }}
            onBlur={() => setInputText("")}
            className="mt-2 w-full rounded-lg border border-white/15 bg-charcoal px-3 py-2.5 font-mono text-sm text-cream outline-none focus:border-amber/60"
          />
        </label>

        <div>
          <input
            type="range"
            min={0}
            max={1000}
            step={1}
            value={Math.round(sliderPos * 1000)}
            onChange={(e) => {
              setActivePresetId(null);
              const p = Number(e.target.value) / 1000;
              setAmount(logSliderToValue(p));
              setInputText("");
            }}
            className="w-full accent-amber"
            aria-label="Amount on logarithmic scale"
          />
          <div className="mt-1 flex justify-between font-mono text-[9px] text-cream/40">
            <span>R1m</span>
            <span>R100bn</span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => applyPreset(p)}
            className={[
              "rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition",
              activePresetId === p.id
                ? "border-amber bg-amber/20 text-amber"
                : "border-white/20 text-cream/75 hover:border-amber/40",
            ].join(" ")}
          >
            {p.label}
          </button>
        ))}
      </div>

      {PRESETS.map((p) =>
        activePresetId === p.id ? (
          <p key={`link-${p.id}`} className="mt-3 text-sm text-cream/70">
            <span className="text-cream/50">Relates to: </span>
            {p.storyHref ? (
              <Link href={p.storyHref} className="text-amber underline-offset-2 hover:underline">
                {p.storyLabel}
              </Link>
            ) : p.storySlug ? (
              <Link
                href={`/story/${p.storySlug}`}
                className="text-amber underline-offset-2 hover:underline"
              >
                {p.storyLabel}
              </Link>
            ) : null}
          </p>
        ) : null,
      )}

      <p className="mt-6 font-serif text-lg text-cream">
        With{" "}
        <span className="text-amber">{formatRandsLong(amount)}</span>, the government could
        have built…
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        <CountCell
          label="RDP houses at ±R250,000 each"
          value={effective.rdp_houses}
          reduce={reduce}
        />
        <CountCell
          label="Child Support Grant years (R6,360/year each)"
          value={effective.child_support_grants}
          reduce={reduce}
        />
        <CountCell
          label="School repairs at R5m each"
          value={effective.school_repairs}
          reduce={reduce}
        />
        <CountCell
          label="Household water connections at R50k"
          value={effective.water_connections}
          reduce={reduce}
        />
        <CountCell
          label="ICU bed equivalents at R1m"
          value={effective.hospital_beds}
          reduce={reduce}
        />
        <CountCell
          label="Teacher salary-years at R300k"
          value={effective.teachers_per_year}
          reduce={reduce}
        />
      </div>

      <button
        type="button"
        onClick={onShare}
        className="mt-6 inline-flex items-center rounded-lg border border-amber/50 bg-amber/10 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-amber transition hover:bg-amber/20"
      >
        Share this calculation
      </button>
    </section>
  );
}
