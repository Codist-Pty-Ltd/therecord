"use client";

import StoryTimeline, {
  type StoryTimelineProps,
} from "@/components/Timeline/StoryTimeline";

/**
 * On the transformation explainer, timeline event blurbs stay at child reading
 * level so historical beats stay approachable; page tabs only affect policy
 * and case {@link PolicyPlainEnglishBox} blocks.
 */
export default function TransformationStoryTimeline(
  props: Omit<StoryTimelineProps, "plainEnglishLevel">,
) {
  return <StoryTimeline {...props} plainEnglishLevel="child" />;
}
