"use client";

import type { IntelligenceAskResponse } from "@the-record/shared-types";

import { clientApiBase } from "@/lib/client-api";

export type AskIntelligenceOptions = {
  topK?: number;
  minSimilarity?: number;
  sourceTypes?: string[];
};

/**
 * Browser-side `POST /api/intelligence/ask` for the Ask The Record page.
 */
export async function askIntelligenceClient(
  query: string,
  opts?: AskIntelligenceOptions,
): Promise<IntelligenceAskResponse> {
  const res = await fetch(`${clientApiBase()}/api/intelligence/ask`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: query.trim(),
      topK: opts?.topK,
      minSimilarity: opts?.minSimilarity,
      sourceTypes: opts?.sourceTypes,
    }),
  });

  if (res.status === 400) {
    let msg = "Please enter a question.";
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (body.message) {
        msg = Array.isArray(body.message)
          ? String(body.message[0])
          : String(body.message);
      }
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  if (res.status === 502 || res.status === 503) {
    throw new Error(
      "The intelligence service is temporarily unavailable. Try again in a moment.",
    );
  }

  if (!res.ok) {
    throw new Error(`Ask request failed (${res.status})`);
  }

  return (await res.json()) as IntelligenceAskResponse;
}
