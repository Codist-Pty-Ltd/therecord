/**
 * Placeholder content used by the homepage while the database is being
 * populated. Every entry is based on a real, public South African story —
 * no lorem ipsum. When the NestJS API returns real records, these are
 * superseded (see the merge logic in `apps/web/app/page.tsx`).
 */

import type {
  StoryDomain,
  StorySummary,
  TimelineEventType,
} from "@the-record/shared-types";

export const MKHWANAZI_SLUG = "mkhwanazi-madlanga-commission";

/** Lightweight event shape for the homepage mini-timeline preview. */
export interface FeaturedPreviewEvent {
  event_date: string;
  event_type: TimelineEventType;
  title: string;
  description: string;
}

/** Rich featured-story shape used by the homepage hero and featured block. */
export interface FeaturedStoryContent {
  slug: string;
  title: string;
  summary: string;
  plain_english_summary: string;
  domain: StoryDomain;
  latest_events: FeaturedPreviewEvent[];
}

/**
 * Mkhwanazi / Madlanga Commission — the reference story featured on the
 * homepage. Based on Lt Gen Nhlanhla Mkhwanazi's July 2025 press conference
 * and the subsequent judicial commission of inquiry.
 */
export const MKHWANAZI_FEATURED: FeaturedStoryContent = {
  slug: MKHWANAZI_SLUG,
  title:
    "The Mkhwanazi allegations: police, politics and the Madlanga Commission",
  summary:
    "In July 2025, KZN Police Commissioner Lt Gen Nhlanhla Mkhwanazi held an extraordinary press conference alleging that senior political figures had obstructed the Political Killings Task Team. Within weeks the President established a judicial commission of inquiry, and Parliament convened its own Ad Hoc Committee.",
  plain_english_summary:
    "A top police general went on TV and said some politicians were blocking the police from doing their job. That's a serious accusation — the Constitution says police must work without political interference. A judge has now been asked to find out if it's true.",
  domain: "criminal_justice",
  latest_events: [
    {
      event_date: "2025-09-02",
      event_type: "hearing",
      title: "Commission opens first public hearings in Pretoria",
      description:
        "The first witnesses are scheduled to testify on the operations of the Political Killings Task Team.",
    },
    {
      event_date: "2025-07-17",
      event_type: "commission_established",
      title: "President establishes the Madlanga Commission",
      description:
        "Retired Justice Bess Nkabinde Madlanga is appointed to chair the judicial commission of inquiry.",
    },
    {
      event_date: "2025-07-06",
      event_type: "press_conference",
      title: "Mkhwanazi alleges political interference in KZN policing",
      description:
        "Lt Gen Mkhwanazi names senior political figures whom he says obstructed investigations into politically-motivated killings.",
    },
  ],
};

/**
 * Placeholder story list used when the API returns zero active stories. Each
 * story references a real South African case — the data is illustrative but
 * drawn from the public record.
 */
/**
 * Stable timestamp used by every placeholder story for `created_at` and
 * `updated_at`. The placeholders are static fixtures, so the value is
 * arbitrary as long as it parses as a valid ISO date — using a single
 * constant keeps diffs noise-free if the fixture grows.
 */
const PLACEHOLDER_TIMESTAMP = "2025-07-17T00:00:00.000Z";

export const PLACEHOLDER_STORIES: StorySummary[] = [
  {
    id: "placeholder-mkhwanazi",
    title: MKHWANAZI_FEATURED.title,
    slug: MKHWANAZI_SLUG,
    domain: MKHWANAZI_FEATURED.domain,
    status: "active",
    summary: MKHWANAZI_FEATURED.summary,
    plain_english_summary: MKHWANAZI_FEATURED.plain_english_summary,
    commission_id: null,
    adhoc_committee_id: null,
    siu_proclamation_id: null,
    accountability_body_id: null,
    primary_impact_sector_id: null,
    state_entity_id: null,
    province_id: null,
    municipality_id: null,
    story_category: null,
    total_amount_rands: null,
    latest_event_date: MKHWANAZI_FEATURED.latest_events[0].event_date,
    event_count: MKHWANAZI_FEATURED.latest_events.length,
    created_at: PLACEHOLDER_TIMESTAMP,
    updated_at: PLACEHOLDER_TIMESTAMP,
  },
  {
    id: "placeholder-phala-phala",
    title: "Phala Phala: the farm, the cash and the unanswered questions",
    slug: "phala-phala-farm",
    domain: "politics",
    status: "active",
    summary:
      "An undisclosed sum of foreign currency was stolen from President Ramaphosa's Phala Phala farm in February 2020. The theft was never reported to police — triggering inquiries by the Public Protector, the SA Reserve Bank, the Hawks and an impeachment debate in the National Assembly.",
    plain_english_summary:
      "Money was stolen from the President's private farm. He didn't tell the police about it. The question is whether he broke any rules — and whether the money was above board in the first place.",
    commission_id: null,
    adhoc_committee_id: null,
    siu_proclamation_id: null,
    accountability_body_id: null,
    primary_impact_sector_id: null,
    state_entity_id: null,
    province_id: null,
    municipality_id: null,
    story_category: null,
    total_amount_rands: null,
    latest_event_date: "2025-11-15",
    event_count: 12,
    created_at: PLACEHOLDER_TIMESTAMP,
    updated_at: PLACEHOLDER_TIMESTAMP,
  },
  {
    id: "placeholder-state-capture-outcomes",
    title: "State Capture: from the Zondo Report to the courtroom",
    slug: "state-capture-outcomes",
    domain: "organised_crime",
    status: "active",
    summary:
      "The Zondo Commission's four-volume report (2022) named ministers, officials and private-sector actors. The NPA's Investigating Directorate has since filed charges in several of those matters. This story tracks every indictment, plea and outcome.",
    plain_english_summary:
      "A big investigation found out that powerful people stole from the country. Now the courts are dealing with them — one case at a time. We track each one until there's a verdict.",
    commission_id: null,
    adhoc_committee_id: null,
    siu_proclamation_id: null,
    accountability_body_id: null,
    primary_impact_sector_id: null,
    state_entity_id: null,
    province_id: null,
    municipality_id: null,
    story_category: null,
    total_amount_rands: null,
    latest_event_date: "2026-02-08",
    event_count: 24,
    created_at: PLACEHOLDER_TIMESTAMP,
    updated_at: PLACEHOLDER_TIMESTAMP,
  },
];
