import type { SearchResponse } from "@the-record/shared-types";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import {
  fetchSearchClient,
  type FetchSearchParams,
} from "@/lib/search-client";

export function useSearch(
  params: FetchSearchParams,
  options?: { enabled?: boolean },
) {
  const q = params.q.trim();
  return useQuery({
    queryKey: ["search", q, params.types, params.limit, params.page],
    queryFn: () => fetchSearchClient({ ...params, q }),
    enabled: (options?.enabled ?? true) && q.length >= 2,
    staleTime: 30 * 1000,
  });
}

export function useSearchInfinite(params: {
  query: string;
  types?: string;
  pageSize: number;
  initial: SearchResponse;
}) {
  return useInfiniteQuery({
    queryKey: ["search", "infinite", params.query, params.types],
    queryFn: ({ pageParam }) =>
      fetchSearchClient({
        q: params.query,
        types: params.types,
        limit: params.pageSize,
        page: pageParam,
      }),
    initialPageParam: 1,
    initialData: {
      pages: [params.initial],
      pageParams: [1],
    },
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((n, p) => n + p.results.length, 0);
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
    staleTime: 30 * 1000,
  });
}
