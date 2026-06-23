"use client";

import { useMemo } from "react";

import PersonRow from "./PersonRow";
import { usePeopleInfinite } from "@/hooks/usePeople";
import type { PeoplePage } from "@/hooks/usePeople";
import type { Person } from "@the-record/shared-types";

export interface PeopleGridProps {
  initialPeople: Person[];
  /** 1-based page the server used for `initialPeople` (e.g. ?page=2). */
  initialPage: number;
  pageSize: number;
  total: number;
  totalPages: number;
  search: string;
  /** Set when a status filter is active (matches API). */
  status: string | null;
}

export default function PeopleGrid({
  initialPeople,
  initialPage,
  pageSize,
  total,
  totalPages,
  search,
  status,
}: PeopleGridProps) {
  const initialPageData: PeoplePage = useMemo(
    () => ({
      data: initialPeople,
      meta: {
        page: initialPage,
        limit: pageSize,
        total,
        total_pages: totalPages,
      },
    }),
    [initialPeople, initialPage, pageSize, total, totalPages],
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
  } = usePeopleInfinite({
    search,
    status,
    pageSize,
    initialPage: initialPageData,
  });

  const items = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? initialPeople,
    [data, initialPeople],
  );

  const canLoadMore = hasNextPage && !isFetchingNextPage;
  const shown = items.length;

  if (error && items.length === 0) {
    return (
      <p className="text-sm text-charcoal/60 py-6" role="alert">
        Could not load people.
      </p>
    );
  }

  return (
    <div>
      <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.16em] text-charcoal/45">
        Showing {shown.toLocaleString("en-ZA")} of {total.toLocaleString("en-ZA")}{" "}
        {total === 1 ? "person" : "people"}
      </p>
      {error ? (
        <p className="mb-3 text-sm text-charge-red" role="status">
          Could not load more.
        </p>
      ) : null}
      <ul
        className="grid grid-cols-1 gap-0 md:grid-cols-2 md:gap-x-2 md:gap-y-0 md:rounded-md md:border md:border-charcoal/8 md:divide-y-0"
        aria-label="People"
      >
        {items.map((p) => (
          <li
            key={p.id}
            className="border-b border-charcoal/8 md:border-b-0 odd:md:border-r odd:md:border-charcoal/8"
          >
            <PersonRow person={p} />
          </li>
        ))}
      </ul>
      {canLoadMore ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
            className="min-h-[48px] min-w-[200px] rounded border border-amber bg-amber px-6 text-sm font-medium text-cream transition hover:bg-amber/90 disabled:opacity-50"
          >
            {isFetchingNextPage ? "Loading…" : "Load more"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
