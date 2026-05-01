"use client";

/**
 * Adapts `StateEntityTimelineRow[]` to {@link StoryTimeline} — same interaction
 * model as commissions (no legal references; synthetic `event_date` from year).
 */

import type {
  EventSignificance,
  EventType,
  StateEntityTimelineRow,
  TimelineEventWithReferences,
} from "@the-record/shared-types";

import StoryTimeline from "@/components/Timeline/StoryTimeline";

interface StateEntityTimelineAdapterProps {
  events: StateEntityTimelineRow[];
  stateEntitySlug: string;
}

export default function StateEntityTimelineAdapter({
  events,
  stateEntitySlug,
}: StateEntityTimelineAdapterProps) {
  const sorted = [...events].sort((a, b) => a.event_date.localeCompare(b.event_date));

  const adapted: TimelineEventWithReferences[] = sorted.map((e) => ({
    id: e.id,
    story_id: e.state_entity_id,
    event_date: e.event_date,
    event_type: e.event_type as unknown as EventType,
    title: e.title,
    description: e.description,
    plain_english: e.plain_english,
    significance: e.significance as EventSignificance,
    source_urls: e.source_url ? [e.source_url] : [],
    created_at: e.created_at,
    legal_references: [],
  }));

  return <StoryTimeline events={adapted} storySlug={stateEntitySlug} />;
}
