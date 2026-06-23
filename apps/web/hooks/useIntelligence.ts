import type { IntelligenceAskResponse } from "@the-record/shared-types";
import { useMutation } from "@tanstack/react-query";

import { askIntelligenceClient } from "@/lib/ask-client";
import { clientPost } from "@/lib/client-api";

type SimplifyResult = {
  simplified: string;
  reading_level: "child" | "layperson" | "legal";
};

export function useAskQuestion() {
  return useMutation({
    mutationFn: (query: string) => askIntelligenceClient(query),
  });
}

export function useSimplifyText() {
  return useMutation({
    mutationFn: ({
      text,
      level,
    }: {
      text: string;
      level: "child" | "layperson" | "legal";
    }) =>
      clientPost<SimplifyResult>("/api/intelligence/summary/simplify", {
        text,
        level,
      }),
  });
}

export type { IntelligenceAskResponse };
