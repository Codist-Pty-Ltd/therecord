import Link from "next/link";

import { resultKey, typeBadgeClass, typeBadgeLabel } from "@/lib/search-ui";
import type { SearchResult } from "@the-record/shared-types";

export function SearchResultRow({
  r,
  highlighted,
  onPick,
  tabIndex = -1,
}: {
  r: SearchResult;
  /** Keyboard-driven highlight in the overlay. */
  highlighted?: boolean;
  onPick?: () => void;
  tabIndex?: number;
}) {
  return (
    <Link
      href={r.url}
      onClick={onPick}
      tabIndex={tabIndex}
      className={[
        "group flex min-h-[52px] items-start gap-2.5 rounded-md px-2 py-2 -mx-2 transition-colors",
        highlighted ? "bg-amber/15" : "hover:bg-charcoal/[0.04]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/50",
      ].join(" ")}
      data-search-result={resultKey(r)}
    >
      <span
        className={[
          "shrink-0 rounded px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider mt-0.5",
          typeBadgeClass(r.type),
        ].join(" ")}
      >
        {typeBadgeLabel(r.type)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-sans text-sm font-medium text-charcoal">
          {r.name}
        </span>
        {r.subtitle ? (
          <span className="block font-sans text-xs text-charcoal/55 line-clamp-1 mt-0.5">
            {r.subtitle}
          </span>
        ) : null}
        {r.plain_english ? (
          <span className="block font-sans text-xs italic text-charcoal/45 line-clamp-1 mt-0.5">
            {r.plain_english}
          </span>
        ) : null}
      </span>
      <span
        className="shrink-0 text-charcoal/35 group-hover:text-amber mt-0.5"
        aria-hidden
      >
        →
      </span>
    </Link>
  );
}
