import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import Parser from 'rss-parser';
import { Repository } from 'typeorm';
import { Article } from '../entities/article.entity';
import { StoryDomain } from '../entities/story.entity';
import { IngestArticleDto } from './dto/ingest-article.dto';
import { IngestionService } from './ingestion.service';
import { YoutubeService } from '../youtube/youtube.service';

/**
 * One publisher we're scraping every cron tick.
 *
 * `name` is what lands in `articles.source_name` so it must match the
 * editorial spelling we want surfaced in the UI ("Daily Maverick", not
 * "dailymaverick.co.za"). `url` is the RSS / Atom endpoint.
 */
interface FeedSource {
  readonly name: string;
  readonly url: string;
}

/** What we extend the default rss-parser item shape with — `content:encoded`
 *  is namespaced and only surfaced when explicitly enrolled in `customFields`.
 *  Some publishers (Daily Maverick, amaBhungane) put the whole article body
 *  here; News24 only fills `content`/`description`.                        */
interface CustomItem {
  'content:encoded'?: string;
  // rss-parser also populates these by default but we redeclare them so the
  // strict-mode compiler doesn't complain when we read them off `Item`.
  content?: string;
  description?: string;
}

const FEEDS: ReadonlyArray<FeedSource> = [
  { name: 'Daily Maverick', url: 'https://www.dailymaverick.co.za/rss' },
  {
    name: 'News24 South Africa',
    // The legacy `feeds.news24.com` URL 301-redirects through to capi24.
    // The feed itself is non-compliant (missing `version="2.0"` on the
    // `<rss>` root) so we fetch and normalise it before parsing — see
    // `pollFeed` for the workaround.
    url: 'https://feeds.capi24.com/v1/Search/articles/news24/TopStories/rss',
  },
  { name: 'amaBhungane', url: 'https://amabhungane.org/feed/' },
];

const SNIPPET_MAX_LENGTH = 500;
const FEED_FETCH_TIMEOUT_MS = 20_000;
const RSS_USER_AGENT =
  'TheRecordBot/1.0 (+https://therecord.codist.co.za; ingest@codist.co.za)';
const RSS_ACCEPT_HEADER =
  'application/rss+xml, application/atom+xml, application/xml;q=0.9, */*;q=0.8';

/**
 * Per-feed dedupe lookup: which `source_url` values have we already
 * persisted? Worst-case the SELECT is O(items × feeds) per tick which at
 * three feeds × ~20 items each is acceptable for now. If we ever cross 50+
 * feeds add a UNIQUE index on `articles.source_url` and switch to bulk
 * `WHERE source_url IN (...)` resolution.
 */
type DedupeFn = (sourceUrl: string) => Promise<boolean>;

/**
 * Scheduled RSS poller for The Record.
 *
 * Polls the configured feeds every 15 minutes and submits any unseen
 * article URL to {@link IngestionService.ingestArticle}. The full pipeline
 * (NER → cluster → persist → optional Claude simplify) runs per-article
 * inside the existing service — this scheduler is purely the discovery
 * layer.
 *
 * Operational notes:
 *   - Gated behind `INGESTION_ENABLED=true`. If the env var is missing or
 *     anything other than the literal string `true`, the cron will tick
 *     but immediately bail (with a single startup log line so operators
 *     know it's intentionally idle).
 *   - Re-entrant safety via `isRunning` — if a tick takes longer than the
 *     15-minute window the next one is skipped rather than overlapping.
 *   - Per-feed isolation via `Promise.allSettled` — a 503 from News24
 *     never blocks Daily Maverick or amaBhungane.
 *   - Per-article isolation via try/catch — one malformed entry never
 *     halts the rest of its feed.
 *   - Dedupe by `source_url` — the URL the publisher actually uses. RSS
 *     `guid` is unreliable (some publishers set it to a content hash that
 *     changes on edits) so we anchor on the canonical link instead.
 */
@Injectable()
export class IngestionSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(IngestionSchedulerService.name);

  /**
   * `rss-parser` instance with `content:encoded` enrolled as a custom
   * field so {@link CustomItem} has the publisher body when it's
   * available.
   *
   * Note: we don't use `parser.parseURL()` — see {@link fetchAndParse}
   * for why. The parser is only ever fed a string body via
   * {@link Parser.parseString}.
   */
  private readonly parser = new Parser<Record<string, unknown>, CustomItem>({
    customFields: {
      item: ['content:encoded'],
    },
  });

  /** Re-entrancy guard. See class doc for rationale. */
  private isRunning = false;

  constructor(
    private readonly ingestion: IngestionService,
    private readonly config: ConfigService,
    private readonly youtube: YoutubeService,
    @InjectRepository(Article)
    private readonly articleRepo: Repository<Article>,
  ) {}

  /**
   * One-shot startup banner so operators can tell from `docker compose
   * logs api` whether the scheduler is armed or intentionally idle.
   */
  onModuleInit(): void {
    if (this.isEnabled()) {
      this.logger.log(
        `RSS scheduler armed — polling ${FEEDS.length} feeds every 15 minutes ` +
          `(INGESTION_ENABLED=true). ` +
          `YouTube discovery: Monday 02:00 (active bodies); 1st of month 04:00 UTC (concluded commissions).`,
      );
    } else {
      this.logger.warn(
        'RSS scheduler is IDLE — set INGESTION_ENABLED=true in the api ' +
          'environment to start polling. The cron will still tick but will ' +
          'no-op until enabled.',
      );
    }
  }

  /**
   * Cron tick — every 15 minutes on the minute (00, 15, 30, 45). Uses the
   * `@nestjs/schedule` 6-field cron format: second / minute / hour / dom
   * / month / dow.
   */
  @Cron('0 */15 * * * *', { name: 'rss-poll' })
  async pollAllFeeds(): Promise<void> {
    if (!this.isEnabled()) return;

    if (this.isRunning) {
      this.logger.warn(
        'Skipping RSS tick — previous run still in progress. Consider ' +
          'reducing the feed count or moving ingestion to a worker queue.',
      );
      return;
    }

    this.isRunning = true;
    const startedAt = Date.now();
    this.logger.log(`RSS tick start — polling ${FEEDS.length} feeds.`);

    try {
      const results = await Promise.allSettled(
        FEEDS.map((feed) => this.pollFeed(feed)),
      );

      const totals = {
        seen: 0,
        ingested: 0,
        skipped: 0,
        failed: 0,
        feedFailures: 0,
      };

      results.forEach((result, idx) => {
        const feed = FEEDS[idx];
        if (result.status === 'fulfilled') {
          totals.seen += result.value.seen;
          totals.ingested += result.value.ingested;
          totals.skipped += result.value.skipped;
          totals.failed += result.value.failed;
        } else {
          totals.feedFailures += 1;
          const err =
            result.reason instanceof Error
              ? result.reason.message
              : String(result.reason);
          this.logger.error(
            `Feed "${feed.name}" failed entirely: ${err}`,
            result.reason instanceof Error ? result.reason.stack : undefined,
          );
        }
      });

      const elapsed = Math.round((Date.now() - startedAt) / 100) / 10;
      this.logger.log(
        `RSS tick done in ${elapsed}s — seen=${totals.seen} ` +
          `ingested=${totals.ingested} skipped=${totals.skipped} ` +
          `failed=${totals.failed} feedFailures=${totals.feedFailures}`,
      );
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Public entry-point so an admin endpoint (or a unit test) can trigger
   * a single tick on demand without waiting for the cron. Honours the
   * `INGESTION_ENABLED` flag and the re-entrancy guard.
   */
  async runOnce(): Promise<void> {
    return this.pollAllFeeds();
  }

  /* ------------------------------------------------------------- private */

  private isEnabled(): boolean {
    return this.config.get<string>('INGESTION_ENABLED') === 'true';
  }

  /** Monday 02:00 — weekly YouTube discovery for active commissions & ad hoc committees. */
  @Cron('0 0 2 * * 1', { name: 'youtube-weekly' })
  async weeklyYoutubeDiscovery(): Promise<void> {
    if (!this.isEnabled()) return;
    this.logger.log('YouTube weekly discovery start.');
    try {
      await this.youtube.runWeeklyDiscovery();
    } catch (err) {
      this.logger.error(
        `YouTube weekly discovery failed: ${err instanceof Error ? err.message : err}`,
        err instanceof Error ? err.stack : undefined,
      );
    }
    this.logger.log('YouTube weekly discovery finished.');
  }

  /** First day of month 04:00 UTC — concluded commissions (announced after 2010). */
  @Cron('0 0 4 1 * *', { name: 'youtube-monthly-concluded' })
  async monthlyYoutubeConcluded(): Promise<void> {
    if (!this.isEnabled()) return;
    this.logger.log('YouTube monthly (concluded commissions) discovery start.');
    try {
      await this.youtube.runMonthlyConcludedDiscovery();
    } catch (err) {
      this.logger.error(
        `YouTube monthly discovery failed: ${err instanceof Error ? err.message : err}`,
        err instanceof Error ? err.stack : undefined,
      );
    }
    this.logger.log('YouTube monthly discovery finished.');
  }

  /**
   * Fetch the feed body ourselves rather than relying on
   * `Parser.parseURL`. Three reasons:
   *
   *   1. The legacy News24 endpoint (`feeds.news24.com`) 301-redirects
   *      twice through to `feeds.capi24.com`. Node's native `fetch`
   *      follows redirects by default — `rss-parser`'s underlying
   *      transport historically does not.
   *   2. The capi24 endpoint refuses any request without a real
   *      `User-Agent` header (returns 403). Setting headers here is
   *      cleaner than threading them through `Parser` config.
   *   3. The capi24 feed is non-compliant — its `<rss>` root has no
   *      `version` attribute, which makes `rss-parser` reject it as
   *      "not RSS 1 or 2". We patch the missing attribute in-flight
   *      so the parser's strict check passes. The patch is a no-op
   *      against any compliant feed.
   *
   * Wrapped in `AbortSignal.timeout()` so a hung publisher can never
   * block a tick for more than {@link FEED_FETCH_TIMEOUT_MS}.
   */
  private async fetchAndParse(url: string): Promise<Parser.Output<CustomItem>> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': RSS_USER_AGENT,
        Accept: RSS_ACCEPT_HEADER,
      },
      signal: AbortSignal.timeout(FEED_FETCH_TIMEOUT_MS),
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(
        `feed fetch failed: HTTP ${response.status} ${response.statusText} ` +
          `(${response.url})`,
      );
    }

    const raw = await response.text();
    const normalised = normaliseRssXml(raw);
    return this.parser.parseString(normalised);
  }

  /**
   * Poll one feed and submit each fresh item to the ingestion pipeline.
   * Returns per-feed counters so the parent {@link pollAllFeeds} can roll
   * up a single summary log line.
   */
  private async pollFeed(feed: FeedSource): Promise<{
    seen: number;
    ingested: number;
    skipped: number;
    failed: number;
  }> {
    const counters = { seen: 0, ingested: 0, skipped: 0, failed: 0 };

    const parsed = await this.fetchAndParse(feed.url);
    const items = parsed.items ?? [];
    counters.seen = items.length;

    if (items.length === 0) {
      this.logger.warn(`Feed "${feed.name}" returned zero items.`);
      return counters;
    }

    const isAlreadyIngested: DedupeFn = async (url) => {
      const existing = await this.articleRepo.findOne({
        where: { source_url: url },
        select: ['id'],
      });
      return !!existing;
    };

    for (const item of items) {
      const dto = this.itemToDto(feed, item);
      if (!dto) {
        counters.skipped += 1;
        continue;
      }

      if (await isAlreadyIngested(dto.source_url)) {
        counters.skipped += 1;
        continue;
      }

      try {
        const result = await this.ingestion.ingestArticle(dto);
        counters.ingested += 1;
        this.logger.log(
          `[${feed.name}] ingested "${truncate(dto.headline, 80)}" → ` +
            `story=${result.story.story_slug} ` +
            `(created=${result.story.was_created}, ` +
            `people=${result.people.length}, ` +
            `legal_refs=${result.legal_references.length}, ` +
            `warnings=${result.warnings.length})`,
        );
      } catch (err) {
        counters.failed += 1;
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `[${feed.name}] failed to ingest "${truncate(dto.headline, 80)}": ${message}`,
          err instanceof Error ? err.stack : undefined,
        );
      }
    }

    this.logger.log(
      `[${feed.name}] tick summary — seen=${counters.seen} ` +
        `ingested=${counters.ingested} skipped=${counters.skipped} ` +
        `failed=${counters.failed}`,
    );

    return counters;
  }

  /**
   * Project a raw RSS item onto the {@link IngestArticleDto} contract,
   * dropping anything that fails the validators we'd otherwise hit at
   * the controller boundary (missing link, missing title, unparseable
   * pubDate, empty body). Returns `null` when the item is unsalvageable;
   * the caller bumps `skipped` and moves on.
   */
  private itemToDto(
    feed: FeedSource,
    item: Parser.Item & CustomItem,
  ): IngestArticleDto | null {
    const link = item.link?.trim();
    const title = item.title?.trim();
    if (!link || !title) return null;

    // Prefer publisher-provided ISO timestamps; fall back to the raw
    // `pubDate` (RFC 822 in most feeds — `new Date()` handles it). Skip
    // anything we can't convert cleanly so the @IsISO8601 validator
    // never tanks the pipeline.
    const pubDateRaw = item.isoDate ?? item.pubDate;
    if (!pubDateRaw) return null;
    const pubDate = new Date(pubDateRaw);
    if (Number.isNaN(pubDate.getTime())) return null;

    // Body resolution — `content:encoded` is the publisher's canonical
    // article HTML when present; `content` is rss-parser's stripped
    // text; `description` / `contentSnippet` are the lead paragraph.
    const fullText =
      item['content:encoded']?.trim() ||
      item.content?.trim() ||
      item.contentSnippet?.trim() ||
      item.description?.trim() ||
      '';
    if (!fullText) return null;

    // Snippet for attribution (≤500 chars). Prefer rss-parser's already-
    // stripped `contentSnippet`; fall back to a stripped slice of the
    // full body if the publisher only sent HTML.
    const snippet = (item.contentSnippet?.trim() || stripHtml(fullText))
      .slice(0, SNIPPET_MAX_LENGTH);
    if (!snippet) return null;

    const dto: IngestArticleDto = {
      headline: title.slice(0, 1000),
      source_name: feed.name,
      source_url: link.slice(0, 2000),
      published_at: pubDate.toISOString(),
      content_snippet: snippet,
      full_text: fullText,
      simplify_summary: true,
      default_domain: StoryDomain.CRIMINAL_JUSTICE,
    };
    return dto;
  }
}

/* --------------------------------------------------------------- helpers */

/**
 * Best-effort HTML → text. We only need a 500-char attribution snippet;
 * a full DOM parse would be overkill. Strips tags, decodes the handful
 * of HTML entities RSS publishers actually emit, then collapses
 * whitespace so the snippet doesn't render as a wall of newlines.
 */
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

/** Cheap headline truncator for log lines so a 200-char title doesn't
 *  mangle a `docker logs` tail. */
function truncate(input: string, max: number): string {
  return input.length <= max ? input : `${input.slice(0, max - 1)}…`;
}

/**
 * In-flight patch for non-compliant RSS feeds — currently News24/capi24,
 * which emit `<rss xmlns:xsi="...">` with no `version` attribute.
 * `rss-parser` rejects such feeds outright with "Feed not recognized as
 * RSS 1 or 2". Inserting `version="2.0"` on the opening `<rss>` tag gets
 * us through with no other side-effects; compliant feeds already have a
 * version and are matched-but-not-replaced by the regex.
 *
 * Atom feeds use `<feed xmlns="...">` instead of `<rss>` so they're
 * untouched by this patch — `rss-parser` handles them via a separate
 * code path.
 */
function normaliseRssXml(xml: string): string {
  return xml.replace(/<rss(\s[^>]*)?>/i, (match, attrs: string | undefined) => {
    if (attrs && /\bversion\s*=/.test(attrs)) {
      return match;
    }
    const tail = attrs ?? '';
    return `<rss version="2.0"${tail}>`;
  });
}
