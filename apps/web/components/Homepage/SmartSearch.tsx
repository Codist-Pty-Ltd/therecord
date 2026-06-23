"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { SearchResultRow } from "@/components/Search/SearchResultRow";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useSearch } from "@/hooks/useSearch";
import { resultKey } from "@/lib/search-ui";

export default function SmartSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const debouncedQ = useDebouncedValue(q, 200);

  const { data, isLoading, isFetching, error } = useSearch(
    { q: debouncedQ, limit: 6, page: 1 },
    { enabled: open && debouncedQ.trim().length >= 2 },
  );

  const results = data?.results ?? [];
  const loading = isLoading || isFetching;
  const errorMessage =
    error instanceof Error ? error.message : error ? "Search failed" : null;

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
    (loading || errorMessage != null || results.length > 0);

  return (
    <section className="bg-cream border-t border-charcoal/10">
      <div
        className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10"
        ref={rootRef}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-charcoal/50 mb-3">
          Search The Record
        </p>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Commissions, people, laws, stories…"
          className="w-full rounded-lg border border-charcoal/15 bg-white px-4 py-3 font-sans text-base text-charcoal placeholder:text-charcoal/40 focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber/30"
          aria-expanded={showPanel}
          aria-controls="smart-search-results"
        />
        {showPanel ? (
          <div
            id="smart-search-results"
            className="mt-2 rounded-lg border border-charcoal/10 bg-white shadow-lg overflow-hidden"
          >
            {loading ? (
              <p className="px-4 py-3 text-sm text-charcoal/50">Searching…</p>
            ) : errorMessage ? (
              <p className="px-4 py-3 text-sm text-charge-red">{errorMessage}</p>
            ) : (
              <ul className="divide-y divide-charcoal/8">
                {results.map((r) => (
                  <li key={resultKey(r)}>
                    <SearchResultRow r={r} />
                  </li>
                ))}
              </ul>
            )}
            {qTrim.length >= 2 ? (
              <div className="border-t border-charcoal/8 px-4 py-2 bg-cream/50">
                <Link
                  href={`/search?q=${encodeURIComponent(qTrim)}`}
                  className="font-mono text-[11px] uppercase tracking-wider text-amber hover:underline"
                  onClick={() => setOpen(false)}
                >
                  View all results →
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
