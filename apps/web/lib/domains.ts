/**
 * Domain metadata — single source of truth for mapping the `StoryDomain`
 * enum (snake_case, from the API) to display labels, icons, and URL slugs.
 */

import type { StoryDomain } from "@the-record/shared-types";

export interface DomainMeta {
  value: StoryDomain;
  /** Full editorial label — "Criminal Justice" */
  label: string;
  /** Abbreviated label for tight spots — "Criminal" */
  short: string;
  /** Emoji icon used in tag pills and hero strips. */
  icon: string;
  /** Kebab-case URL slug — "criminal-justice" */
  slug: string;
  /** Short editorial description, one sentence. */
  description: string;
}

export const DOMAINS: DomainMeta[] = [
  {
    value: "criminal_justice",
    label: "Criminal Justice",
    short: "Criminal",
    icon: "⚖️",
    slug: "criminal-justice",
    description: "Policing, prosecutions and courts.",
  },
  {
    value: "politics",
    label: "Politics",
    short: "Politics",
    icon: "🏛",
    slug: "politics",
    description: "Parliament, cabinet and the executive.",
  },
  {
    value: "organised_crime",
    label: "Organised Crime",
    short: "Org. Crime",
    icon: "⚡",
    slug: "organised-crime",
    description: "Racketeering, extortion and illicit markets.",
  },
  {
    value: "business",
    label: "Business",
    short: "Business",
    icon: "💼",
    slug: "business",
    description: "Corporate conduct, regulators and markets.",
  },
  {
    value: "labour",
    label: "Labour",
    short: "Labour",
    icon: "🔨",
    slug: "labour",
    description: "Unions, strikes and workplace rights.",
  },
  {
    value: "corruption",
    label: "Corruption",
    short: "Corruption",
    icon: "📋",
    slug: "corruption",
    description: "Bribery, procurement capture and looting of public funds.",
  },
];

export const DOMAIN_BY_VALUE: Record<StoryDomain, DomainMeta> =
  Object.fromEntries(DOMAINS.map((d) => [d.value, d])) as Record<
    StoryDomain,
    DomainMeta
  >;

export function getDomainMeta(domain: StoryDomain): DomainMeta {
  return DOMAIN_BY_VALUE[domain] ?? DOMAINS[0];
}
