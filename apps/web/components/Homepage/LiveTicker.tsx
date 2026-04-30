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
        className="bg-charcoal text-amber border-b border-white/[0.06] overflow-hidden whitespace-nowrap w-full"
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
      className="bg-charcoal text-amber border-b border-white/[0.06] overflow-hidden whitespace-nowrap w-full min-w-0"
      aria-live="off"
    >
      <p className="sr-only">Headlines: {items.join(". ")}</p>
      <div className="group w-full min-w-0 overflow-hidden whitespace-nowrap">
        <div className="homepage-ticker-track group-hover:[animation-play-state:paused] inline-block whitespace-nowrap min-h-[2.75rem] align-middle">
          {track.map((text, i) => (
            <span
              key={`${i}-${text.slice(0, 24)}`}
              aria-hidden={i >= items.length}
              className="inline-block whitespace-nowrap px-8 font-mono text-[11px] tracking-[0.2em] uppercase align-middle"
            >
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
