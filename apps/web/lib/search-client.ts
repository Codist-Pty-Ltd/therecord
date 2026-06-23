"use client";

import type { SearchResponse } from "@the-record/shared-types";

import { clientApiBase } from "@/lib/client-api";

export interface FetchSearchParams {
  q: string;
  types?: string;
  limit?: number;
  page?: number;
}

/**
 * Browser-side `GET /api/search` for the overlay, homepage smart search, and
 * “load more” on the dedicated search page.
 */
export async function fetchSearchClient(
  params: FetchSearchParams,
): Promise<SearchResponse> {
  const u = new URLSearchParams();
  u.set("q", params.q.trim());
  if (params.types) u.set("types", params.types);
  if (params.limit != null) u.set("limit", String(params.limit));
  if (params.page != null) u.set("page", String(params.page));
  const res = await fetch(`${clientApiBase()}/api/search?${u.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (res.status === 400) {
    let msg = "Search query must be at least 2 characters";
    try {
      const body = (await res.json()) as
        | { message?: string | string[] }
        | unknown;
      if (
        body &&
        typeof body === "object" &&
        "message" in body &&
        body.message
      ) {
        msg = Array.isArray(body.message)
          ? String(body.message[0])
          : String(body.message);
      }
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  if (!res.ok) {
    throw new Error(`Search request failed (${res.status})`);
  }
  return (await res.json()) as SearchResponse;
}
