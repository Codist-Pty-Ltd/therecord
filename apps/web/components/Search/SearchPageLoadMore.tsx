"use client";

import { useMemo } from "react";

import { useSearchInfinite } from "@/hooks/useSearch";
import type { SearchResponse } from "@the-record/shared-types";

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
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
  } = useSearchInfinite({
    query: initial.query,
    types,
    pageSize,
    initial,
  });

  const merged = useMemo(
    () => data?.pages.flatMap((p) => p.results) ?? initial.results,
    [data, initial.results],
  );

  const loaded = merged.length;
  const { total } = initial;
  const canLoadMore = hasNextPage && loaded < total;

  if (merged.length === 0) return null;

  return (
    <div className="mt-8">
      <SearchResultsGrouped results={merged} />
      {error ? (
        <p className="mt-4 text-sm text-charge-red" role="alert">
          {error instanceof Error ? error.message : "Could not load more"}
        </p>
      ) : null}
      {canLoadMore ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
            className="inline-flex items-center gap-2 rounded-full border border-charcoal/15 bg-white px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-charcoal hover:border-amber hover:text-amber disabled:opacity-50"
          >
            {isFetchingNextPage ? "Loading…" : "Load more"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
