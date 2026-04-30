"use client";

import { useEffect, useState } from "react";

/**
 * Animates `value` from 0 → `target` over `durationMs` when `active` becomes true.
 * Respects an optional `reducedMotion` flag (skip animation, snap to target).
 */
export function useCountUp(
  target: number,
  active: boolean,
  durationMs: number,
  reducedMotion: boolean,
): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    if (!Number.isFinite(target) || target < 0) {
      setValue(0);
      return;
    }
    if (reducedMotion) {
      setValue(Math.round(target));
      return;
    }
    if (target === 0) {
      setValue(0);
      return;
    }

    let start: number | null = null;
    let frame = 0;

    const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsed = now - start;
      const p = Math.min(elapsed / durationMs, 1);
      setValue(Math.round(target * easeOutCubic(p)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };

    setValue(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, durationMs, reducedMotion]);

  return value;
}
