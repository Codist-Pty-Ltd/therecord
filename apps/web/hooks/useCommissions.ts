import type {
  CommissionDetail,
  CommissionSummary,
} from "@the-record/shared-types";
import { useQuery } from "@tanstack/react-query";

import { clientGet } from "@/lib/client-api";
import type { Paginated } from "@/lib/pagination";

export function useCommissions() {
  return useQuery({
    queryKey: ["commissions"],
    queryFn: () => clientGet<Paginated<CommissionSummary>>("/api/commissions"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCommission(slug: string) {
  return useQuery({
    queryKey: ["commissions", slug],
    queryFn: () => clientGet<CommissionDetail>(`/api/commissions/${slug}`),
    enabled: Boolean(slug),
  });
}
