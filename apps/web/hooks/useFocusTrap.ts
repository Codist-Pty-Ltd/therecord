"use client";

import { type RefObject, useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((el) => {
    if (el.hasAttribute("disabled")) return false;
    if (el.getAttribute("tabindex") === "-1") return false;
    if (el.getAttribute("aria-hidden") === "true") return false;
    return el.getClientRects().length > 0;
  });
}

/**
 * When `isActive` is true, keeps keyboard focus within `containerRef` and
 * restores the previously focused element when released.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  isActive: boolean,
): void {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const root = containerRef.current;
    if (!root) {
      return;
    }

    const active = document.activeElement;
    previousFocusRef.current =
      active instanceof HTMLElement ? active : null;

    const focusable = getFocusableElements(root);
    const raf = requestAnimationFrame(() => {
      if (focusable[0] && isActive) {
        focusable[0].focus();
      }
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const nodes = getFocusableElements(root);
      if (nodes.length === 0) return;
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      const current = document.activeElement;
      if (!root.contains(current)) {
        e.preventDefault();
        first.focus();
        return;
      }
      if (e.shiftKey) {
        if (current === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (current === last) {
        e.preventDefault();
        first.focus();
      }
    };

    root.addEventListener("keydown", onKeyDown, true);
    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener("keydown", onKeyDown, true);
      const prev = previousFocusRef.current;
      if (prev && document.body.contains(prev)) {
        prev.focus({ preventScroll: true });
      }
      previousFocusRef.current = null;
    };
  }, [isActive, containerRef]);
}
