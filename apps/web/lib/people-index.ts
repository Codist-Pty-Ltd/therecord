import type { PersonStatus } from "@the-record/shared-types";

/** URL filter chips (subset of {@link PersonStatus}; "All" = no param). */
export const PEOPLE_INDEX_STATUS_VALUES = [
  "active",
  "suspended",
  "charged",
  "acquitted",
] as const satisfies Readonly<PersonStatus[]>;

export type PeopleIndexFilterStatus =
  (typeof PEOPLE_INDEX_STATUS_VALUES)[number];

export function isPeopleIndexStatus(
  s: string | undefined,
): s is PeopleIndexFilterStatus {
  if (!s) return false;
  return (PEOPLE_INDEX_STATUS_VALUES as readonly string[]).includes(s);
}
