"use client";

import { useReducedMotion } from "framer-motion";

export interface LiveTickerProps {
  items: string[];
}

/**
 * Full-width infinite marquee. Items are duplicated for a seamless CSS loop;
 * pauses on hover via `animation-play-state`. Decorative: `aria-live="off"`.
 */
export default function LiveTicker({ items }: LiveTickerProps) {
  const reduce = useReducedMotion() ?? false;

  if (items.length === 0) {
    return null;
  }

  if (reduce) {
    return (
      <div
        className="bg-charcoal text-amber border-b border-white/[0.06] overflow-hidden"
        aria-live="off"
      >
        <div
          className="flex w-full min-h-[2.75rem] flex-wrap items-center justify-center gap-x-6 gap-y-1 px-4 py-2"
          aria-label="Headlines (decorative)"
        >
          {items.map((text, i) => (
            <span
              key={`${i}-${text.slice(0, 20)}`}
              className="font-mono text-[11px] tracking-[0.2em] uppercase"
            >
              {text}
            </span>
          ))}
        </div>
      </div>
    );
  }

  const track = [...items, ...items];

  return (
    <div
      className="bg-charcoal text-amber border-b border-white/[0.06] overflow-hidden"
      aria-live="off"
    >
      <p className="sr-only">Headlines: {items.join(". ")}</p>
      <div className="group w-full">
        <div className="homepage-ticker-track group-hover:[animation-play-state:paused] flex w-max min-h-[2.75rem] items-center">
          {track.map((text, i) => (
            <span
              key={`${i}-${text.slice(0, 24)}`}
              aria-hidden={i >= items.length}
              className="shrink-0 px-8 font-mono text-[11px] tracking-[0.2em] uppercase"
            >
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
