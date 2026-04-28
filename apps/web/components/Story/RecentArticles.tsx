import type { Article } from "@the-record/shared-types";

interface RecentArticlesProps {
  articles: Article[];
  /** Maximum articles to render. Default 12 to keep the sidebar compact. */
  limit?: number;
}

/**
 * Compact list of recent press coverage for a story. Mobile: collapsible
 * accordion below the timeline. Desktop: flush part of the sidebar.
 *
 * Content snippets are intentionally truncated to 500 chars in the DB; we
 * never reproduce full article text (copyright).
 */
export default function RecentArticles({
  articles,
  limit = 12,
}: RecentArticlesProps) {
  if (articles.length === 0) return null;

  const recent = [...articles]
    .sort(
      (a, b) =>
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
    )
    .slice(0, limit);

  const content = <ArticleList articles={recent} />;

  return (
    <section aria-label="Recent coverage">
      {/* Mobile — collapsible */}
      <details className="group lg:hidden border-b border-charcoal/10">
        <summary className="list-none cursor-pointer select-none flex items-center justify-between gap-3 py-4 md:py-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/40 rounded">
          <div className="flex flex-col">
            <h2 className="label-smallcaps text-charcoal/55">
              Recent coverage
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-charcoal/40 mt-1">
              {articles.length}{" "}
              {articles.length === 1 ? "article" : "articles"}
            </span>
          </div>
          <span
            aria-hidden
            className="w-9 h-9 rounded-full border border-charcoal/15 flex items-center justify-center text-charcoal/60 text-base transition-transform group-open:rotate-45"
          >
            +
          </span>
        </summary>

        <div className="pt-2 pb-6">{content}</div>
      </details>

      {/* Desktop */}
      <div className="hidden lg:flex lg:flex-col">
        <div className="flex items-baseline justify-between mb-5 pb-3 border-b border-charcoal/10">
          <h2 className="label-smallcaps text-charcoal/55">Recent coverage</h2>
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-charcoal/40">
            {articles.length}{" "}
            {articles.length === 1 ? "article" : "articles"}
          </span>
        </div>
        {content}
      </div>
    </section>
  );
}

function ArticleList({ articles }: { articles: Article[] }) {
  return (
    <ol className="flex flex-col divide-y divide-charcoal/10">
      {articles.map((article) => (
        <ArticleRow key={article.id} article={article} />
      ))}
    </ol>
  );
}

function ArticleRow({ article }: { article: Article }) {
  return (
    <li className="py-3 md:py-4 first:pt-0">
      <a
        href={article.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-col gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/40 rounded"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-legal-blue">
            {article.source_name}
          </span>
          <time
            dateTime={article.published_at}
            className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.14em] text-charcoal/45 whitespace-nowrap"
          >
            {formatRelativeDate(article.published_at)}
          </time>
        </div>

        <h3 className="font-serif text-[15px] md:text-base leading-snug text-charcoal group-hover:text-amber transition-colors">
          {article.headline}
        </h3>

        {article.content_snippet ? (
          <p className="font-sans text-[13px] text-charcoal/65 leading-relaxed line-clamp-2">
            {article.content_snippet}
          </p>
        ) : null}

        <span className="inline-flex items-center gap-1 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-charcoal/40 mt-0.5 group-hover:text-amber transition-colors">
          Read at {article.source_name}
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </span>
      </a>
    </li>
  );
}

const SAST_TIMEZONE = "Africa/Johannesburg";

/**
 * Human-friendly date like "3 days ago", falling back to an absolute SAST
 * date for anything older than ~14 days.
 */
function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours <= 0) return "just now";
    if (diffHours === 1) return "1 hr ago";
    return `${diffHours} hrs ago`;
  }
  if (diffDays === 1) return "yesterday";
  if (diffDays < 14) return `${diffDays} days ago`;

  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: SAST_TIMEZONE,
  }).format(date);
}
