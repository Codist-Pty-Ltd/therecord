/** Slugs populated by `sa-history.seed.ts` — keep in sync with API. */
export const HISTORY_ERA_SLUGS = [
  "pre-colonial",
  "colonial",
  "union-and-segregation",
  "apartheid",
  "post-apartheid",
] as const;

export type HistoryEraSlug = (typeof HISTORY_ERA_SLUGS)[number];

export function isHistoryEraSlug(s: string): s is HistoryEraSlug {
  return (HISTORY_ERA_SLUGS as readonly string[]).includes(s);
}
