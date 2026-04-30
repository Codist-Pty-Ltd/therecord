"use client";

import { useEffect, useState } from "react";

import { useSearchOverlayStore } from "@/stores/search.store";

function useMacOSHint(): "⌘K" | "Ctrl+K" {
  const [hint, setHint] = useState<"⌘K" | "Ctrl+K">("Ctrl+K");
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const p = navigator.platform;
    if (/^Mac/i.test(p) || p === "iPhone" || p === "iPad") {
      setHint("⌘K");
    } else {
      setHint("Ctrl+K");
    }
  }, []);
  return hint;
}

export function HeaderSearchButton() {
  const open = useSearchOverlayStore((s) => s.open);
  const hint = useMacOSHint();

  return (
    <div className="flex items-center gap-1 lg:gap-1.5">
      <button
        type="button"
        onClick={open}
        aria-label="Search The Record (⌘K)"
        className="w-11 h-11 lg:w-9 lg:h-9 inline-flex items-center justify-center rounded text-cream/85 hover:text-amber transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60 -mr-0.5"
      >
        <SearchMagnifierIcon className="w-5 h-5" />
      </button>
      <span className="hidden lg:inline font-mono text-[10px] text-cream/40 tracking-[0.12em] select-none">
        {hint}
      </span>
    </div>
  );
}

function SearchMagnifierIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden
    >
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.2 15.2 21 21" strokeLinecap="round" />
    </svg>
  );
}
