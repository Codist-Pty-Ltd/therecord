"use client";

import type {
  AccountabilityBodyTimelineEvent,
  TimelineEventWithReferences,
} from "@the-record/shared-types";

import StoryTimeline from "@/components/Timeline/StoryTimeline";

interface AccountabilityBodyMergedTimelineProps {
  events: AccountabilityBodyTimelineEvent[];
  /** DOM prefix for timeline anchors (use body slug). */
  bodySlug: string;
}

/**
 * Adapts merged timeline events from several stories into the shared
 * {@link StoryTimeline} component (same interaction model as commissions).
 */
export default function AccountabilityBodyMergedTimeline({
  events,
  bodySlug,
}: AccountabilityBodyMergedTimelineProps) {
  const sorted = [...events].sort((a, b) =>
    a.event_date.localeCompare(b.event_date),
  );

  const adapted: TimelineEventWithReferences[] = sorted.map((e) => ({
    id: e.id,
    story_id: e.story_id,
    event_date: e.event_date,
    event_type: e.event_type,
    title: e.title,
    description: e.description,
    plain_english: e.plain_english ?? "",
    significance: e.significance,
    source_urls: [],
    created_at: "",
    legal_references: [],
  }));

  return <StoryTimeline events={adapted} storySlug={bodySlug} />;
}
