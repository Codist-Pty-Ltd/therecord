"use client";

import type {
  AdhocCommitteeTimelineEvent,
  TimelineEventWithReferences,
} from "@the-record/shared-types";

import StoryTimeline from "@/components/Timeline/StoryTimeline";

export default function AdhocCommitteeTimeline({
  events,
  committeeSlug,
}: {
  events: AdhocCommitteeTimelineEvent[];
  committeeSlug: string;
}) {
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
    plain_english: e.plain_english,
    significance: e.significance,
    source_urls: [],
    created_at: "",
    legal_references: [],
  }));

  return <StoryTimeline events={adapted} storySlug={committeeSlug} />;
}
