"use client";

import { useEffect } from "react";

import { trackStoryView } from "@/lib/umami";

import StoryShareButtons from "./StoryShareButtons";

interface StoryAnalyticsProps {
  title: string;
  slug: string;
  story_category?: string | null;
  commission_id?: string | null;
}

export default function StoryAnalytics({
  title,
  slug,
  story_category,
  commission_id,
}: StoryAnalyticsProps) {
  useEffect(() => {
    trackStoryView({ title, slug, story_category, commission_id });
  }, [title, slug, story_category, commission_id]);

  return <StoryShareButtons slug={slug} title={title} />;
}
