"use client";

import { useTransformationReadingLevel } from "./ReadingLevelContext";

const TAB_LABELS: Array<{
  id: "child" | "layperson" | "legal";
  icon: string;
  label: string;
}> = [
  { id: "child", icon: "🧒", label: "Child" },
  { id: "layperson", icon: "💬", label: "Plain" },
  { id: "legal", icon: "⚖️", label: "Legal" },
];

export default function TransformationReadingLevelTabs() {
  const { level, setLevel } = useTransformationReadingLevel();

  return (
    <nav
      aria-label="Reading level"
      className="sticky top-14 z-30 border-y border-charcoal/10 bg-cream/95 backdrop-blur-md px-4 py-3 md:top-16 md:px-8"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 md:gap-3">
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-charcoal/50 sm:inline">
          Reading level
        </span>
        <div className="flex rounded-full border border-charcoal/15 bg-white p-1 shadow-sm">
          {TAB_LABELS.map((tab) => {
            const active = level === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setLevel(tab.id)}
                aria-pressed={active}
                className={[
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-mono text-[10px] uppercase tracking-[0.15em] transition-colors md:px-4",
                  active
                    ? "bg-charcoal text-cream"
                    : "text-charcoal/70 hover:bg-cream hover:text-charcoal",
                ].join(" ")}
              >
                <span aria-hidden>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
