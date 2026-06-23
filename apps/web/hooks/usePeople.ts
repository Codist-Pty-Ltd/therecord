import type { Person } from "@the-record/shared-types";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { clientGet } from "@/lib/client-api";
import type { Paginated } from "@/lib/pagination";

export type PeopleFilters = {
  search?: string;
  status?: string | null;
  page?: number;
  limit?: number;
};

export type PeoplePage = Paginated<Person>;

function buildPeoplePath(filters: PeopleFilters): string {
  const q = new URLSearchParams();
  q.set("page", String(filters.page ?? 1));
  q.set("limit", String(filters.limit ?? 20));
  if (filters.search?.trim()) q.set("search", filters.search.trim());
  if (filters.status) q.set("status", filters.status);
  return `/api/people?${q.toString()}`;
}

async function fetchPeople(filters: PeopleFilters): Promise<PeoplePage> {
  return clientGet<PeoplePage>(buildPeoplePath(filters));
}

export function usePeople(filters?: PeopleFilters) {
  return useQuery({
    queryKey: ["people", filters],
    queryFn: () => fetchPeople(filters ?? {}),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePeopleInfinite(params: {
  search: string;
  status: string | null;
  pageSize: number;
  initialPage: PeoplePage;
}) {
  return useInfiniteQuery({
    queryKey: ["people", "infinite", params.search, params.status],
    queryFn: ({ pageParam }) =>
      fetchPeople({
        search: params.search,
        status: params.status,
        page: pageParam,
        limit: params.pageSize,
      }),
    initialPageParam: params.initialPage.meta.page,
    initialData: {
      pages: [params.initialPage],
      pageParams: [params.initialPage.meta.page],
    },
    getNextPageParam: (lastPage) => {
      const { page, total_pages: totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });
}
