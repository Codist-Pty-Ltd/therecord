"use client";

import { useCallback, useMemo, useState } from "react";

import { fetchSearchClient } from "@/lib/search-client";
import type { SearchResult, SearchResponse } from "@the-record/shared-types";

import { SearchResultsGrouped } from "./SearchResultsGrouped";

interface SearchPageLoadMoreProps {
  initial: SearchResponse;
  types?: string;
  pageSize: number;
}

/**
 * Appends further pages from `GET /api/search` when `total` exceeds what
 * has been loaded so far (up to API `limit` max of 30 per request).
 */
export default function SearchPageLoadMore({
  initial,
  types,
  pageSize,
}: SearchPageLoadMoreProps) {
  const [pages, setPages] = useState<SearchResult[][]>([initial.results]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const merged = useMemo(() => pages.flat(), [pages]);

  const loaded = merged.length;
  const { total } = initial;
  const canLoadMore = loaded < total;

  const onLoadMore = useCallback(async () => {
    if (loading || !canLoadMore) return;
    setLoading(true);
    setError(null);
    try {
      const next = await fetchSearchClient({
        q: initial.query,
        types,
        limit: pageSize,
        page: page + 1,
      });
      setPage((p) => p + 1);
      setPages((prev) => [...prev, next.results]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load more");
    } finally {
      setLoading(false);
    }
  }, [
    canLoadMore,
    initial.query,
    loading,
    page,
    pageSize,
    types,
  ]);

  if (merged.length === 0) return null;

  return (
    <div className="mt-8">
      <SearchResultsGrouped results={merged} />
      {error ? (
        <p className="mt-4 text-sm text-charge-red">{error}</p>
      ) : null}
      {canLoadMore ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-charcoal/15 bg-white px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-charcoal hover:border-amber hover:text-amber disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
