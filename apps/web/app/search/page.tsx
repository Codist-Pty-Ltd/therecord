import type { Metadata } from "next";
import Link from "next/link";

import EmptyState from "@/components/ui/EmptyState";
import SearchPageLoadMore from "@/components/Search/SearchPageLoadMore";
import { SearchResultsGrouped } from "@/components/Search/SearchResultsGrouped";
import { searchGlobal } from "@/lib/api";
import {
  FILTER_CHIPS,
  hrefForSearchPage,
  typesParamToFilterId,
} from "@/lib/search-ui";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

function asString(
  v: string | string[] | undefined,
): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export async function generateMetadata(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const sp = await props.searchParams;
  const q = asString(sp.q)?.trim() ?? "";
  return {
    robots: { index: false, follow: true },
    title: q.length === 0 ? "Search" : `${q} — Search`,
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const qRaw = asString(sp.q) ?? "";
  const typesRaw = asString(sp.types) ?? undefined;
  const q = qRaw.trim();
  const typesParam = typesRaw?.trim() || undefined;
  const activeFilter = typesParamToFilterId(typesParam);

  let initial: Awaited<ReturnType<typeof searchGlobal>> = null;
  if (q.length >= 2) {
    try {
      initial = await searchGlobal(q, {
        types: typesParam,
        limit: PAGE_SIZE,
        page: 1,
      });
    } catch {
      initial = null;
    }
  }

  return (
    <div className="min-w-0 max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10">
      <h1 className="font-serif text-2xl text-charcoal tracking-tight">
        {q.length >= 2
          ? (
            <>
              Search results for &lsquo;{q}&rsquo;
            </>
            )
          : "Search The Record"}
      </h1>

      <div className="mt-6 -mx-1 overflow-x-auto scrollbar-hidden pb-1 flex gap-0 border-b border-charcoal/10">
        {FILTER_CHIPS.map((c) => {
          const active = activeFilter === c.id;
          return (
            <Link
              key={c.id}
              href={hrefForSearchPage(q || undefined, c.id)}
              scroll={false}
              className={[
                "shrink-0 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] border-b-2 -mb-px",
                active
                  ? "border-amber text-charcoal"
                  : "border-transparent text-charcoal/45 hover:text-charcoal/70",
              ].join(" ")}
            >
              {c.label}
            </Link>
          );
        })}
      </div>

      {q.length > 0 && q.length < 2 ? (
        <p className="mt-8 text-sm text-charcoal/60">
          Enter at least 2 characters to search.
        </p>
      ) : null}

      {q.length >= 2 && !initial ? (
        <p className="mt-8 text-sm text-charcoal/60">
          Search is unavailable. Check that the API is running.
        </p>
      ) : null}

      {q.length >= 2 && initial && initial.total === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="🔍"
            heading={`No matches for "${q}"`}
            body="Nothing here with that phrasing for now. Try a person's name, a commission, or a law such as PRECCA."
            action={{ label: "← Back to home", href: "/" }}
          />
        </div>
      ) : null}

      {q.length >= 2 && initial && initial.total > 0
      && initial.total <= PAGE_SIZE ? (
        <div className="mt-8">
          <SearchResultsGrouped results={initial.results} />
        </div>
      ) : null}

      {q.length >= 2 && initial && initial.total > PAGE_SIZE ? (
        <SearchPageLoadMore
          initial={initial}
          types={typesParam}
          pageSize={PAGE_SIZE}
        />
      ) : null}

      {q.length === 0 ? (
        <p className="mt-8 text-sm text-charcoal/55 max-w-md leading-relaxed">
          Enter a search query above, or use the search icon in the header.
          You can also press ⌘K (Mac) or Ctrl+K (Windows) from anywhere.
        </p>
      ) : null}
    </div>
  );
}
