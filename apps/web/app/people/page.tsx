import type { Metadata } from "next";
import { Suspense } from "react";

import FiltersBar from "@/components/People/FiltersBar";
import PeopleGrid from "@/components/People/PeopleGrid";
import EmptyState from "@/components/ui/EmptyState";
import { isPeopleIndexStatus } from "@/lib/people-index";

import type { Person } from "@the-record/shared-types";

export const metadata: Metadata = {
  title: "Key Figures",
  description:
    "Every person with a documented role in South African commissions, investigations, and accountability bodies.",
};

const PAGE_SIZE = 20;

interface PaginatedPeople {
  data: Person[];
  meta: { page: number; limit: number; total: number; total_pages: number };
}

function serverApiBase(): string | null {
  const u = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  return u ? u.replace(/\/+$/, "") : null;
}

async function fetchPeopleJson(
  path: string,
): Promise<PaginatedPeople | null> {
  const base = serverApiBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 900 },
    });
    if (!res.ok) return null;
    return (await res.json()) as PaginatedPeople;
  } catch {
    return null;
  }
}

function buildListQuery(params: {
  page: number;
  search: string;
  status: string | null;
}): string {
  const q = new URLSearchParams();
  q.set("page", String(params.page));
  q.set("limit", String(PAGE_SIZE));
  if (params.search.trim()) q.set("search", params.search.trim());
  if (params.status) q.set("status", params.status);
  return `/api/people?${q.toString()}`;
}

type SearchParams = {
  search?: string | string[];
  status?: string | string[];
  page?: string | string[];
};

function first(v: string | string[] | undefined): string {
  if (v === undefined) return "";
  return Array.isArray(v) ? (v[0] ?? "") : v;
}

export default async function PeoplePage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await props.searchParams;
  const search = first(sp.search);
  const pageRaw = first(sp.page);
  const page = Math.max(1, Math.floor(Number(pageRaw) || 1));
  const statusRaw = first(sp.status);
  const status = isPeopleIndexStatus(statusRaw) ? statusRaw : null;

  const [listRes, totalPeople, chargedTotal, suspendedTotal] = await Promise.all(
    [
      fetchPeopleJson(buildListQuery({ page, search, status })),
      fetchPeopleJson(
        buildListQuery({ page: 1, search: "", status: null }),
      ).then((r) => r?.meta?.total ?? 0),
      fetchPeopleJson(
        buildListQuery({ page: 1, search: "", status: "charged" }),
      ).then((r) => r?.meta?.total ?? 0),
      fetchPeopleJson(
        buildListQuery({ page: 1, search: "", status: "suspended" }),
      ).then((r) => r?.meta?.total ?? 0),
    ],
  );

  const hasApi = serverApiBase() !== null;
  const noConfig = !hasApi;
  const people = listRes?.data ?? [];
  const meta = listRes?.meta ?? {
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    total_pages: 0,
  };

  const loadFailed = hasApi && listRes === null;
  const isEmpty = people.length === 0;
  const searchDisplay = search.trim();

  return (
    <div className="min-w-0 overflow-x-hidden bg-cream">
      <header className="max-w-6xl mx-auto px-4 md:px-8 pt-10 md:pt-16 pb-8">
        <h1 className="font-serif text-[28px] leading-tight text-charcoal">
          Key Figures
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-charcoal/60">
          Every person with a documented role in South African commissions,
          investigations, court cases, and accountability bodies.
        </p>
        <dl className="mt-6 flex flex-wrap gap-6 md:gap-10">
          <div>
            <dt className="font-sans text-xs text-charcoal/50">People tracked</dt>
            <dd className="mt-0.5 font-serif text-2xl text-amber tabular-nums">
              {totalPeople.toLocaleString("en-ZA")}
            </dd>
          </div>
          <div>
            <dt className="font-sans text-xs text-charcoal/50 max-w-[11rem]">
              Active investigations
            </dt>
            <dd className="mt-0.5 font-serif text-2xl text-amber tabular-nums">
              {chargedTotal.toLocaleString("en-ZA")}
            </dd>
          </div>
          <div>
            <dt className="font-sans text-xs text-charcoal/50">Currently suspended</dt>
            <dd className="mt-0.5 font-serif text-2xl text-amber tabular-nums">
              {suspendedTotal.toLocaleString("en-ZA")}
            </dd>
          </div>
        </dl>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-8 pb-12 md:pb-20">
        <Suspense
          fallback={
            <div
              className="mb-6 h-[120px] rounded border border-charcoal/5 bg-white/50 animate-pulse"
              aria-hidden
            />
          }
        >
          <FiltersBar />
        </Suspense>

        {noConfig ? (
          <EmptyState
            icon="👤"
            heading="People directory is not wired here"
            body="This build does not have an API base URL, so we cannot list profiles. Configure API_URL in the environment to browse people."
          />
        ) : loadFailed ? (
          <EmptyState
            icon="👤"
            heading="This list did not load"
            body="The directory could not be reached. Refresh the page, or return home and try again in a few minutes."
            action={{ label: "← Back to home", href: "/" }}
          />
        ) : isEmpty ? (
          <div>
            <EmptyState
              icon="👤"
              heading={
                searchDisplay
                  ? `No people match "${searchDisplay}"`
                  : "No one matches the current filter"
              }
              body="Try a different name or role, or clear filters to see the full list."
              action={{ label: "Show everyone", href: "/people" }}
            />
          </div>
        ) : (
          <PeopleGrid
            initialPeople={people}
            initialPage={meta.page}
            pageSize={PAGE_SIZE}
            total={meta.total}
            totalPages={meta.total_pages}
            search={search}
            status={status}
          />
        )}
      </div>
    </div>
  );
}
