"use client";

import { useEffect, useMemo, useState } from "react";

import type { Person } from "@the-record/shared-types";

import PersonRow from "./PersonRow";

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

function apiBaseUrl(): string {
  const b = process.env.NEXT_PUBLIC_API_URL;
  if (!b) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }
  return b.replace(/\/+$/, "");
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
  const [items, setItems] = useState<Person[]>(initialPeople);
  const [pageLoaded, setPageLoaded] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listKey = useMemo(
    () => `${search}\0${status ?? ""}`,
    [search, status],
  );

  useEffect(() => {
    setItems(initialPeople);
    setPageLoaded(initialPage);
    setError(null);
  }, [initialPeople, listKey, initialPage]);

  const canLoadMore = pageLoaded < totalPages && !loading;
  const shown = items.length;

  const onLoadMore = async () => {
    if (!canLoadMore) return;
    setLoading(true);
    setError(null);
    const next = pageLoaded + 1;
    const q = new URLSearchParams();
    q.set("page", String(next));
    q.set("limit", String(pageSize));
    if (search.trim()) q.set("search", search.trim());
    if (status) q.set("status", status);
    try {
      const res = await fetch(`${apiBaseUrl()}/api/people?${q.toString()}`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        setError("Could not load more.");
        return;
      }
      const body = (await res.json()) as { data: Person[] };
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const extra = body.data.filter((p) => !seen.has(p.id));
        return [...prev, ...extra];
      });
      setPageLoaded(next);
    } catch {
      setError("Could not load more.");
    } finally {
      setLoading(false);
    }
  };

  if (error && items.length === 0) {
    return <p className="text-sm text-charcoal/60 py-6">{error}</p>;
  }

  return (
    <div>
      <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.16em] text-charcoal/45">
        Showing {shown.toLocaleString("en-ZA")} of {total.toLocaleString("en-ZA")}{" "}
        {total === 1 ? "person" : "people"}
      </p>
      {error ? (
        <p className="mb-3 text-sm text-charge-red" role="status">
          {error}
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
            onClick={() => void onLoadMore()}
            disabled={loading}
            className="min-h-[48px] min-w-[200px] rounded border border-amber bg-amber px-6 text-sm font-medium text-cream transition hover:bg-amber/90 disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
