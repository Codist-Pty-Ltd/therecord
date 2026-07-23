"use client";

/** POPIA-friendly custom events — only call from client components. */

export type StorySharePlatform = "whatsapp" | "twitter" | "copy";

export function trackUmamiEvent(
  eventName: string,
  data?: Record<string, string | number | boolean | undefined>,
): void {
  if (typeof window === "undefined") return;
  const payload = data
    ? Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined && v !== ""),
      )
    : undefined;
  window.umami?.track(eventName, payload);
}

export function trackStoryView(story: {
  title: string;
  slug: string;
  story_category?: string | null;
  commission_id?: string | null;
}): void {
  trackUmamiEvent("story-view", {
    title: story.title,
    slug: story.slug,
    category: story.story_category ?? undefined,
    commission_id: story.commission_id ?? undefined,
  });
}

export function trackDocumentDownload(documentName: string): void {
  trackUmamiEvent("document-download", { documentName });
}

export function trackStoryShare(
  platform: StorySharePlatform,
  slug: string,
): void {
  trackUmamiEvent("story-share", { platform, slug });
}

export function trackSearch(query: string): void {
  trackUmamiEvent("search", { query });
}
