import type { ProvinceStoryCategoryCount } from "@the-record/shared-types";

import { storyCategoryLabel } from "@/lib/story-category-labels";

/**
 * Short editorial note when multiple story categories appear in a province.
 */
export function buildProvincePatternsNote(
  provinceName: string,
  counts: ProvinceStoryCategoryCount[],
  storyTotal: number,
): string | null {
  const positive = counts.filter((c) => c.count > 0);
  if (storyTotal < 2 || positive.length < 2) {
    return null;
  }
  const sorted = [...positive].sort((a, b) => b.count - a.count);
  const first = sorted[0];
  const second = sorted[1];
  if (!first || !second) return null;
  return (
    `${provinceName} combines ${storyCategoryLabel(first.story_category).toLowerCase()} (${first.count} stories) with ${storyCategoryLabel(second.story_category).toLowerCase()} (${second.count}). ` +
    `That overlap often traces procurement and service-delivery pressure — read across matters, not as one-off scandals.`
  );
}
