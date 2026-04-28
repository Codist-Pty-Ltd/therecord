"use client";

import { useEffect } from "react";

import { useSearchOverlayStore } from "@/stores/search.store";

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  if (t.isContentEditable) return true;
  const n = t.tagName;
  if (n === "INPUT" || n === "TEXTAREA" || n === "SELECT") return true;
  return Boolean(t.closest('[contenteditable="true"]'));
}

/**
 * ⌘/Ctrl+K toggles the overlay. "/" opens it when focus is not in a field.
 */
export function SearchGlobalShortcuts() {
  const open = useSearchOverlayStore((s) => s.open);
  const toggle = useSearchOverlayStore((s) => s.toggle);
  const isOpen = useSearchOverlayStore((s) => s.isOpen);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
        return;
      }
      if (e.key === "/" && !isOpen && !isTypingTarget(e.target)) {
        e.preventDefault();
        open();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, open, toggle]);

  return null;
}
