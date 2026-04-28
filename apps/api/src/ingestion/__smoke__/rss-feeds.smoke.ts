/**
 * One-off smoke test for the RSS scheduler's discovery layer.
 *
 * Exercises:
 *   - Network reachability of all three configured feeds.
 *   - rss-parser's handling of each publisher's quirks (Daily Maverick
 *     emits `content:encoded`, News24 only emits `description`,
 *     amaBhungane emits both).
 *   - The same `itemToDto`-style projection the scheduler uses, so we
 *     can eyeball that snippets, headlines, ISO dates, and full-text
 *     bodies survive validation before they hit the ingestion service.
 *
 * Run: `docker compose exec api npx ts-node src/ingestion/__smoke__/rss-feeds.smoke.ts`
 *
 * Not part of the boot path. Lives under `__smoke__/` so the Nest CLI
 * doesn't accidentally scan it as a module.
 */

import Parser from 'rss-parser';

interface CustomItem {
  'content:encoded'?: string;
  content?: string;
  description?: string;
}

const FEEDS = [
  { name: 'Daily Maverick', url: 'https://www.dailymaverick.co.za/rss' },
  {
    name: 'News24 South Africa',
    url: 'https://feeds.capi24.com/v1/Search/articles/news24/TopStories/rss',
  },
  { name: 'amaBhungane', url: 'https://amabhungane.org/feed/' },
] as const;

const SNIPPET_MAX = 500;
const FETCH_TIMEOUT_MS = 20_000;
const UA =
  'TheRecordBot/1.0 (+https://therecord.codist.co.za; ingest@codist.co.za)';

function normaliseRssXml(xml: string): string {
  return xml.replace(/<rss(\s[^>]*)?>/i, (match, attrs: string | undefined) => {
    if (attrs && /\bversion\s*=/.test(attrs)) return match;
    return `<rss version="2.0"${attrs ?? ''}>`;
  });
}

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main(): Promise<void> {
  const parser = new Parser<Record<string, unknown>, CustomItem>({
    customFields: { item: ['content:encoded'] },
  });

  for (const feed of FEEDS) {
    console.log(`\n=== ${feed.name} (${feed.url}) ===`);
    let parsed;
    try {
      const response = await fetch(feed.url, {
        headers: {
          'User-Agent': UA,
          Accept:
            'application/rss+xml, application/atom+xml, application/xml;q=0.9, */*;q=0.8',
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        redirect: 'follow',
      });
      if (!response.ok) {
        console.log(`  FETCH ERROR: HTTP ${response.status} ${response.statusText}`);
        continue;
      }
      const raw = await response.text();
      parsed = await parser.parseString(normaliseRssXml(raw));
    } catch (err) {
      console.log(
        `  FETCH ERROR:`,
        err instanceof Error ? err.message : String(err),
      );
      continue;
    }

    const items = parsed.items ?? [];
    console.log(`  fetched ${items.length} items`);

    let valid = 0;
    let skipped = 0;
    let withEncoded = 0;

    for (const item of items as Array<Parser.Item & CustomItem>) {
      const link = item.link?.trim();
      const title = item.title?.trim();
      if (!link || !title) {
        skipped++;
        continue;
      }
      const pubDateRaw = item.isoDate ?? item.pubDate;
      if (!pubDateRaw) {
        skipped++;
        continue;
      }
      const pubDate = new Date(pubDateRaw);
      if (Number.isNaN(pubDate.getTime())) {
        skipped++;
        continue;
      }

      const fullText =
        item['content:encoded']?.trim() ||
        item.content?.trim() ||
        item.contentSnippet?.trim() ||
        item.description?.trim() ||
        '';
      if (!fullText) {
        skipped++;
        continue;
      }

      const snippet = (item.contentSnippet?.trim() || stripHtml(fullText))
        .slice(0, SNIPPET_MAX);
      if (!snippet) {
        skipped++;
        continue;
      }

      if (item['content:encoded']) withEncoded++;
      valid++;
    }

    console.log(
      `  valid=${valid} skipped=${skipped} withContentEncoded=${withEncoded}`,
    );

    const sample = items[0] as Parser.Item & CustomItem | undefined;
    if (sample) {
      console.log(`  sample.title         : ${sample.title?.slice(0, 80) ?? ''}`);
      console.log(`  sample.link          : ${sample.link ?? ''}`);
      console.log(`  sample.pubDate       : ${sample.isoDate ?? sample.pubDate ?? ''}`);
      console.log(
        `  sample.snippet (≤80) : ${(sample.contentSnippet ?? '').slice(0, 80)}`,
      );
      const bodySrc = sample['content:encoded']
        ? `content:encoded (${sample['content:encoded'].length} chars)`
        : sample.content
        ? `content (${sample.content.length} chars)`
        : sample.description
        ? `description (${sample.description.length} chars)`
        : 'NONE';
      console.log(`  sample.body source   : ${bodySrc}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('SMOKE FAILED:', err);
    process.exit(1);
  });
