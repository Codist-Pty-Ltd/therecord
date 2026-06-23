import type { MoneyToReality } from "@the-record/shared-types";
import { useQuery } from "@tanstack/react-query";

import { clientGet } from "@/lib/client-api";
import { computeMoneyToReality } from "@/lib/money-to-reality";

export function useMoneyToReality(amountRands: number) {
  const rands = Math.max(1, Math.floor(amountRands));

  return useQuery({
    queryKey: ["impact", "money-to-reality", rands],
    queryFn: async (): Promise<MoneyToReality> => {
      try {
        return await clientGet<MoneyToReality>(
          `/api/impact/money-to-reality?rands=${encodeURIComponent(String(rands))}`,
        );
      } catch {
        return computeMoneyToReality(rands);
      }
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: () => computeMoneyToReality(rands),
  });
}
