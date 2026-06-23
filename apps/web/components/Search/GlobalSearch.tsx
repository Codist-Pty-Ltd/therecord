"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useSearch } from "@/hooks/useSearch";
import {
  FILTER_CHIPS,
  filterIdToTypesParam,
  flattenGroupedResults,
  resultKey,
  type SearchFilterId,
} from "@/lib/search-ui";
import { useSearchOverlayStore } from "@/stores/search.store";

import { SearchGlobalShortcuts } from "./SearchGlobalShortcuts";
import { SearchResultsGrouped } from "./SearchResultsGrouped";

const RECENT_KEY = "the-record-recent-searches";

type RecentItem = { query: string; timestamp: number };

const SUGGESTED_QUERIES = [
  "Mkhwanazi",
  "State Capture",
  "PRECCA",
  "Zondo Commission",
  "Jacob Zuma",
];

function readRecent(): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    const r = localStorage.getItem(RECENT_KEY);
    if (!r) return [];
    const p = JSON.parse(r) as unknown;
    if (!Array.isArray(p)) return [];
    return p
      .filter(
        (x): x is RecentItem =>
          x != null &&
          typeof (x as RecentItem).query === "string" &&
          typeof (x as RecentItem).timestamp === "number",
      )
      .slice(0, 5);
  } catch {
    return [];
  }
}

function writeRecent(items: RecentItem[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(items.slice(0, 5)));
  } catch {
    /* ignore */
  }
}

function pushRecentQuery(q: string) {
  const t = q.trim();
  if (t.length < 2) return;
  const prev = readRecent().filter(
    (x) => x.query.toLowerCase() !== t.toLowerCase(),
  );
  writeRecent([{ query: t, timestamp: Date.now() }, ...prev].slice(0, 5));
}

export default function GlobalSearch() {
  return (
    <>
      <SearchGlobalShortcuts />
      <GlobalSearchModal />
    </>
  );
}

/**
 * Document-level shortcuts when the modal is closed. (When open, the modal
 * handles navigation keys.)
 */
function GlobalSearchModal() {
  const isOpen = useSearchOverlayStore((s) => s.isOpen);
  const close = useSearchOverlayStore((s) => s.close);
  const reduce = useReducedMotion() ?? false;

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SearchFilterId>("all");
  const [highlight, setHighlight] = useState(0);

  const debouncedQuery = useDebouncedValue(query, 200);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  useFocusTrap(listRef, isOpen);

  const typesParam = useMemo(
    () => filterIdToTypesParam(filter),
    [filter],
  );

  const {
    data: searchData,
    isLoading,
    isFetching,
    error: searchError,
    isSuccess,
  } = useSearch(
    { q: debouncedQuery, types: typesParam, limit: 10, page: 1 },
    { enabled: isOpen },
  );

  const results = searchData?.results ?? [];
  const total = searchData?.total ?? 0;
  const loading =
    debouncedQuery.trim().length >= 2 && (isLoading || isFetching);
  const error =
    searchError instanceof Error
      ? searchError.message
      : searchError
        ? "Search failed"
        : null;

  const flatResults = useMemo(
    () => flattenGroupedResults(results),
    [results],
  );

  useEffect(() => {
    if (isSuccess && debouncedQuery.trim().length >= 2) {
      pushRecentQuery(debouncedQuery);
    }
  }, [isSuccess, debouncedQuery]);

  useEffect(() => {
    setHighlight(0);
  }, [results, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const onClose = useCallback(() => {
    close();
    setQuery("");
    setFilter("all");
  }, [close]);

  useEffect(() => {
    if (!isOpen) return;
    const onDoc = (e: MouseEvent) => {
      const el = (e.target as Node) ?? null;
      if (listRef.current && !listRef.current.contains(el)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [isOpen, onClose]);

  const navigateTo = useCallback(
    (url: string) => {
      onClose();
      router.push(url);
    },
    [onClose, router],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (flatResults.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => Math.min(flatResults.length - 1, h + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => Math.max(0, h - 1));
      } else if (e.key === "Enter") {
        const r = flatResults[highlight];
        if (r) {
          e.preventDefault();
          navigateTo(r.url);
        }
      }
    },
    [flatResults, highlight, navigateTo, onClose],
  );

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[200] flex items-start justify-center pt-[8vh] px-3 md:px-4"
          initial={reduce ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: reduce ? 0.001 : 0.15 }}
        >
          <div
            className="absolute inset-0 z-0"
            style={{ background: "rgba(28,28,30,0.7)" }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={listRef}
            role="dialog"
            aria-modal="true"
            aria-label="Search The Record"
            onKeyDown={onKeyDown}
            className="relative w-[90vw] max-w-[640px] z-[1] max-h-[90vh] flex flex-col rounded-xl bg-cream border border-charcoal/10 shadow-2xl overflow-hidden"
            initial={reduce ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: reduce ? 0.001 : 0.2, ease: "easeOut" }}
            style={{ maxHeight: "min(90vh, 800px)" }}
          >
            <div className="p-3 md:p-4 border-b border-charcoal/10">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search The Record…"
                  className="flex-1 min-w-0 bg-transparent font-serif text-[20px] text-charcoal placeholder:text-charcoal/40 outline-none border-0 p-0"
                  autoComplete="off"
                  autoFocus
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="shrink-0 w-8 h-8 text-charcoal/45 hover:text-charcoal"
                    aria-label="Clear"
                  >
                    ×
                  </button>
                ) : null}
                {loading ? (
                  <span
                    className="shrink-0 w-4 h-4 border-2 border-amber/30 border-t-amber rounded-full animate-spin"
                    aria-label="Loading"
                  />
                ) : null}
              </div>
              <div className="mt-3 -mx-1 overflow-x-auto scrollbar-hidden pb-1 flex gap-0 border-b border-charcoal/5">
                {FILTER_CHIPS.map((c) => {
                  const active = filter === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setFilter(c.id)}
                      className={[
                        "shrink-0 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] border-b-2 -mb-px",
                        active
                          ? "border-amber text-charcoal"
                          : "border-transparent text-charcoal/45 hover:text-charcoal/70",
                      ].join(" ")}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className="flex-1 min-h-[200px] max-h-[60vh] overflow-y-auto overscroll-contain px-2 md:px-3 py-2"
            >
              {error ? (
                <p className="text-sm text-charge-red px-2 py-4">{error}</p>
              ) : null}

              {!error && query.trim().length < 2 ? (
                <div className="px-2 py-3 space-y-6">
                  {readRecent().length > 0 ? (
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-charcoal/45 mb-2">
                        Recent searches
                      </p>
                      <ul className="flex flex-col gap-1">
                        {readRecent().map((r) => (
                          <li key={r.timestamp}>
                            <button
                              type="button"
                              onClick={() => {
                                setQuery(r.query);
                              }}
                              className="w-full text-left font-mono text-sm text-charcoal/80 hover:text-amber py-1.5"
                            >
                              🕐 {r.query}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-charcoal/45 mb-2">
                      Suggested searches
                    </p>
                    <ul className="flex flex-col gap-1">
                      {SUGGESTED_QUERIES.map((s) => (
                        <li key={s}>
                          <button
                            type="button"
                            onClick={() => {
                              setQuery(s);
                            }}
                            className="w-full text-left font-mono text-sm text-charcoal/80 hover:text-amber py-1.5"
                          >
                            {s}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}

              {!error && !loading && query.trim().length >= 2 && results.length === 0 ? (
                <div className="px-2 py-10 text-center">
                  <p className="font-sans text-sm text-charcoal/75">
                    No results for &lsquo;{query.trim()}&rsquo;
                  </p>
                  <p className="mt-3 text-xs text-charcoal/50 max-w-sm mx-auto leading-relaxed">
                    Try searching for a person&apos;s name, a commission name,
                    or a law like &lsquo;PRECCA&rsquo;.
                  </p>
                </div>
              ) : null}

              {loading && query.trim().length >= 2 ? (
                <div className="space-y-2 px-2 py-1">
                  <div className="h-10 rounded search-skeleton-shimmer" />
                  <div className="h-10 rounded search-skeleton-shimmer" />
                  <div className="h-10 rounded search-skeleton-shimmer" />
                </div>
              ) : null}

              {!loading && query.trim().length >= 2 && results.length > 0 ? (
                <SearchResultsGrouped
                  results={results}
                  highlightedKey={
                    flatResults[highlight]
                      ? resultKey(flatResults[highlight])
                      : null
                  }
                  onResultNavigate={onClose}
                />
              ) : null}
            </div>

            {query.trim().length >= 2 && !loading ? (
              <div className="border-t border-charcoal/10 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-[10px] text-charcoal/50">
                  {total} {total === 1 ? "result" : "results"}
                </p>
                <div className="flex items-center gap-3 ml-auto">
                  <Link
                    href={`/search?q=${encodeURIComponent(query.trim())}${
                      typesParam
                        ? `&types=${encodeURIComponent(typesParam)}`
                        : ""
                    }`}
                    onClick={onClose}
                    className="font-mono text-[10px] text-amber hover:underline"
                  >
                    See all results →
                  </Link>
                  <p className="hidden md:block font-mono text-[10px] text-charcoal/40 text-right">
                    ↑↓ Navigate · Enter Select · Esc Close
                  </p>
                </div>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}