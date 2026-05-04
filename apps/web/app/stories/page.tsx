import type { Metadata } from "next";

import ActiveStoriesList from "@/components/Home/ActiveStoriesList";
import { listStories } from "@/lib/api";
import { PLACEHOLDER_STORIES } from "@/lib/placeholders";
import type { StorySummary } from "@the-record/shared-types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All stories",
  description:
    "Every active story on The Record — South African news tracked from incident to verdict, with every charge linked to the relevant law.",
};

async function loadStories(): Promise<StorySummary[]> {
  try {
    const paginated = await listStories(1, 100, {
      sort: "updated_at",
      order: "DESC",
    });
    return paginated.data.length > 0 ? paginated.data : PLACEHOLDER_STORIES;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[/stories] API unreachable — falling back to placeholders", err);
    }
    return PLACEHOLDER_STORIES;
  }
}

export default async function StoriesPage() {
  const stories = await loadStories();

  return (
    <>
      <header className="max-w-6xl mx-auto px-4 md:px-8 pt-12 md:pt-20 pb-2 md:pb-4">
        <p className="font-mono text-[11px] md:text-xs uppercase tracking-[0.22em] text-amber mb-5">
          All stories
        </p>
        <h1 className="font-serif text-[36px] md:text-6xl leading-[1.05] text-charcoal max-w-3xl">
          Every story on The Record.
        </h1>
        <p className="mt-6 md:mt-8 font-sans text-base md:text-lg text-charcoal/70 max-w-2xl leading-[1.55]">
          Sorted by the most recently updated threads. Click through to see the
          full timeline, the people involved, and the laws that apply.
        </p>
      </header>

      <ActiveStoriesList stories={stories} />
    </>
  );
}
