"use client";

/**
 * CommissionTimeline — thin adapter that reuses the existing StoryTimeline
 * component for a commission's unified timeline.
 *
 * The commission API returns a slightly thinner `CommissionTimelineEvent`
 * (no `source_urls`, no `legal_references`, no `created_at`), but the
 * StoryTimeline renders correctly when those optional fields are empty —
 * so we coerce the shape here and hand it straight across.
 *
 * Using the same component on both pages keeps the interaction model
 * identical: tap a node, read the event, jump to plain English.
 */

import type {
  CommissionTimelineEvent,
  TimelineEventWithReferences,
} from "@the-record/shared-types";

import StoryTimeline from "@/components/Timeline/StoryTimeline";

interface CommissionTimelineProps {
  events: CommissionTimelineEvent[];
  /** Commission slug — used as the per-event DOM anchor prefix. */
  commissionSlug: string;
}

export default function CommissionTimeline({
  events,
  commissionSlug,
}: CommissionTimelineProps) {
  // Sort chronologically ASC. The API promises this, but if a caller passes
  // a filtered subset we'd rather be defensive than render events jumbled.
  const sorted = [...events].sort((a, b) =>
    a.event_date.localeCompare(b.event_date),
  );

  const adapted: TimelineEventWithReferences[] = sorted.map((e) => ({
    id: e.id,
    story_id: e.story_id,
    event_date: e.event_date,
    event_type: e.event_type,
    title: e.title,
    // Prefix the description with a mini eyebrow pointing to the source
    // story. Commissions pull events from multiple stories, and the reader
    // should always be able to trace an event back to its narrative.
    description: e.description,
    plain_english: e.plain_english,
    significance: e.significance,
    source_urls: [],
    created_at: "",
    legal_references: [],
  }));

  return <StoryTimeline events={adapted} storySlug={commissionSlug} />;
}
