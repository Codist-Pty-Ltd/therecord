"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { SearchResultRow } from "@/components/Search/SearchResultRow";
import { fetchSearchClient } from "@/lib/search-client";
import { resultKey } from "@/lib/search-ui";
import type { SearchResult } from "@the-record/shared-types";

export default function SmartSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const t = q.trim();
    if (t.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    debounceRef.current = setTimeout(() => {
      void (async () => {
        try {
          const data = await fetchSearchClient({ q: t, limit: 6, page: 1 });
          setResults(data.results);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Search failed");
          setResults([]);
        } finally {
          setLoading(false);
        }
      })();
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q]);

  const onDocClick = useCallback((e: MouseEvent) => {
    if (!rootRef.current?.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [onDocClick]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const qTrim = q.trim();
  const showPanel =
    open &&
    qTrim.length >= 2 &&
    (loading || error != null || results.length > 0);

  return (
    <section className="bg-cream border-t border-charcoal/10">
      <div
        className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10"
        ref={rootRef}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-charcoal/50 mb-3">
          Smart search
        </p>
        <div className="relative">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40">
            <SearchIcon className="h-4 w-4" aria-hidden />
          </div>
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search people, commissions, laws, cases…"
            className="w-full min-h-[48px] rounded border border-cream pl-10 pr-4 text-sm text-charcoal shadow-sm outline-none transition focus:border-amber focus:ring-1 focus:ring-amber"
            autoComplete="off"
            aria-label="Search The Record"
            aria-expanded={showPanel}
            aria-controls="homepage-search-results"
          />
          {showPanel ? (
            <div
              id="homepage-search-results"
              className="absolute z-20 mt-1 w-full overflow-hidden rounded border border-charcoal/10 bg-white shadow-lg"
              role="listbox"
            >
              {error ? (
                <p className="px-3 py-2 text-sm text-charge-red">{error}</p>
              ) : null}
              {loading && !error ? (
                <p className="px-3 py-2 text-xs text-charcoal/50">Searching…</p>
              ) : null}
              {!loading && !error && results.length > 0 ? (
                <ul className="max-h-80 overflow-y-auto py-1" role="list">
                  {results.map((r) => (
                    <li key={resultKey(r)} className="px-1" role="option">
                      <SearchResultRow
                        r={r}
                        onPick={() => setOpen(false)}
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
              {!loading && !error && qTrim.length >= 2 && results.length === 0
                ? (
                    <p className="px-3 py-3 text-sm text-charcoal/60">
                      No quick matches. Try a longer query or see all results.
                    </p>
                  )
                : null}
              {qTrim.length >= 2 ? (
                <div className="border-t border-charcoal/10 px-2 py-2">
                  <Link
                    href={`/search?q=${encodeURIComponent(qTrim)}`}
                    onClick={() => setOpen(false)}
                    className="block text-center font-mono text-[11px] text-amber hover:underline"
                  >
                    See all results →
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function SearchIcon({ className }: { className?: string }) {
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
