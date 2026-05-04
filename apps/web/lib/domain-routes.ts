/**
 * Valid URL segments for /domain/[name] and mapping to the API
 * `CommissionDomain` / `StoryDomain` query values (snake_case).
 */

import type { CommissionDomain, StoryDomain } from "@the-record/shared-types";

/** Kebab-case slugs in the public URL (11 commission domains). */
export const DOMAIN_PAGE_SLUGS = [
  "criminal-justice",
  "corruption",
  "politics",
  "organised-crime",
  "business",
  "labour",
  "human-rights",
  "financial",
  "education",
  "policing",
  "public-safety",
] as const;

export type DomainPageSlug = (typeof DOMAIN_PAGE_SLUGS)[number];

const DOMAIN_SLUG_SET = new Set<string>(DOMAIN_PAGE_SLUGS);

const SLUG_TO_COMMISSION: Record<DomainPageSlug, CommissionDomain> = {
  "criminal-justice": "criminal_justice",
  corruption: "corruption",
  politics: "politics",
  "organised-crime": "organised_crime",
  business: "business",
  labour: "labour",
  "human-rights": "human_rights",
  financial: "financial",
  education: "education",
  policing: "policing",
  "public-safety": "public_safety",
};

/**
 * H1 and metadata labels — match editorial / prompt 1.3 (some differ from
 * `COMMISSION_DOMAIN_LABELS` short forms).
 */
export const DOMAIN_PAGE_LABEL: Record<DomainPageSlug, string> = {
  "criminal-justice": "Criminal Justice",
  corruption: "Corruption",
  politics: "Politics & Government",
  "organised-crime": "Organised Crime",
  business: "Business",
  labour: "Labour",
  "human-rights": "Human Rights",
  financial: "Financial Accountability",
  education: "Education",
  policing: "Policing",
  "public-safety": "Public Safety",
};

/** The `story_domain` values — stories list API filters on these. */
const STORY_LIST_DOMAIN = new Set<CommissionDomain>([
  "criminal_justice",
  "politics",
  "organised_crime",
  "business",
  "labour",
  "corruption",
]);

export function isValidDomainPageSlug(name: string): name is DomainPageSlug {
  return DOMAIN_SLUG_SET.has(name);
}

export function domainSlugToCommission(name: string): CommissionDomain | null {
  if (!isValidDomainPageSlug(name)) return null;
  return SLUG_TO_COMMISSION[name];
}

export function domainPageTitleLabel(name: string): string {
  if (!isValidDomainPageSlug(name)) return "Domain";
  return DOMAIN_PAGE_LABEL[name];
}

/**
 * When the page domain is one of the five story domains, the stories list
 * endpoint can apply `?domain=`. Otherwise the stories count is 0 from the
 * client without calling the API.
 */
export function commissionToStoryListDomain(
  d: CommissionDomain,
): StoryDomain | null {
  if (!STORY_LIST_DOMAIN.has(d)) return null;
  return d as StoryDomain;
}
