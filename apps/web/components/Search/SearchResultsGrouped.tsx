import { groupHeaderFor, groupSearchResults, resultKey } from "@/lib/search-ui";
import type { SearchResult } from "@the-record/shared-types";

import { SearchResultRow } from "./SearchResultRow";

/**
 * Renders a flat `SearchResult[]` list with mono group headers, used by
 * the global overlay and the `/search` page.
 */
export function SearchResultsGrouped({
  results,
  highlightedKey,
  onResultNavigate,
}: {
  results: SearchResult[];
  /** `${type}-${id}` of the keyboard-highlighted row (overlay only). */
  highlightedKey?: string | null;
  onResultNavigate?: () => void;
}) {
  if (results.length === 0) return null;
  const groups = groupSearchResults(results);
  return (
    <div className="flex flex-col gap-5">
      {groups.map((g) => (
        <div key={g.type}>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-charcoal/45 mb-1">
            {groupHeaderFor(g.type)}
          </p>
          <ul className="flex flex-col gap-0.5" role="list">
            {g.items.map((r) => (
              <li key={resultKey(r)}>
                <SearchResultRow
                  r={r}
                  highlighted={highlightedKey === resultKey(r)}
                  onPick={onResultNavigate}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
