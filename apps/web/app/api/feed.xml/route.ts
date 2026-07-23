import { listStories } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 300;

const SITE_URL = "https://therecord.co.za";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** RSS 2.0 feed of latest stories — for journalists and RSS readers. */
export async function GET() {
  const { data: stories } = await listStories(1, 30, {
    sort: "updated_at",
    order: "DESC",
  });

  const items = stories
    .map((story) => {
      const link = `${SITE_URL}/story/${story.slug}`;
      const description =
        story.plain_english_summary?.trim() ||
        story.summary?.trim() ||
        story.title;
      const pubDate = new Date(story.updated_at).toUTCString();

      return `    <item>
      <title>${escapeXml(story.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(description)}</description>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>The Record</title>
    <link>${SITE_URL}</link>
    <description>South African accountability journalism — stories tracked from incident to outcome.</description>
    <language>en-za</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
