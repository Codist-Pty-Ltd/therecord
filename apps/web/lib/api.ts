/**
 * Server-side API helpers for talking to the NestJS backend.
 *
 * These run in Node during SSR / RSC rendering, so they use `API_URL`
 * (internal Docker DNS) rather than `NEXT_PUBLIC_API_URL` (public origin).
 *
 * Requests are wrapped in React's `cache()` to dedupe within a single request
 * — meaning `generateMetadata` and the page component share one fetch.
 */

import "server-only";

import { cache } from "react";

import type {
  AdhocCommitteeDetail,
  AdhocCommitteeSummary,
  CommissionDetail,
  CommissionDomain,
  CommissionSummary,
  LawSectionDetail,
  LawSummary,
  LawWithSections,
  MunicipalityDetail,
  PersonDetail,
  PersonSummary,
  ProvinceDetail,
  ProvinceListItem,
  ProvinceMoneySummary,
  ProvinceStoriesPage,
  SiuOverviewResponse,
  SiuProclamationDetail,
  SiuProclamationSummary,
  SpecialTribunalOverviewResponse,
  SearchResponse,
  StoryCategory,
  StoryDetail,
  StoryDomain,
  StorySummary,
  YoutubeVideo,
} from "@the-record/shared-types";

/** Paginated envelope from the NestJS pagination helper. */
export interface Paginated<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

/** Short-lived story / timeline data (matches typical ingestion cadence). */
const REVALIDATE_STORIES_SECONDS = 300;
/** Rarely-changing reference data: commissions, laws, constitution. */
const REVALIDATE_STABLE_SECONDS = 3600;
/** Semi-stable: people directory, SIU aggregates. */
const REVALIDATE_SEMI_STABLE_SECONDS = 900;

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Resolved backend origin for server-side fetches. Returns `null` when no URL is
 * configured **and** we're in production so `next build` / static generation
 * can finish without a live API; pages treat `null` fetches like empty /
 * not-found state. Runtime (Docker) should always set `API_URL`.
 */
function resolveApiBaseUrl(): string | null {
  const url = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    if (process.env.NODE_ENV === "production") {
      return null;
    }
    throw new Error(
      "API_URL is not configured — set it in the server environment " +
        "(docker-compose API_URL or .env). Required for server-side fetches.",
    );
  }
  return url.replace(/\/+$/, "");
}

type ApiGetInit = {
  revalidate?: number | false;
  tags?: string[];
  /** Search and other user-specific fetches should bypass the data cache. */
  cacheNoStore?: boolean;
};

async function apiGet<T>(path: string, init?: ApiGetInit): Promise<T | null> {
  const base = resolveApiBaseUrl();
  if (base === null) {
    return null;
  }
  const url = `${base}${path}`;

  const res = await fetch(
    url,
    init?.cacheNoStore
      ? {
          headers: { Accept: "application/json" },
          cache: "no-store",
        }
      : {
          headers: { Accept: "application/json" },
          next: {
            revalidate:
              init?.revalidate === false
                ? false
                : (init?.revalidate ?? REVALIDATE_STORIES_SECONDS),
            tags: init?.tags,
          },
        },
  );

  if (res.status === 404) return null;

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(
      `API ${res.status} for ${path}${text ? `: ${text.slice(0, 300)}` : ""}`,
      res.status,
    );
  }

  return (await res.json()) as T;
}

/**
 * Fetch a full story dossier by slug. Returns `null` when the API responds
 * with 404 so the caller can delegate to Next's `notFound()` helper.
 */
export const getStory = cache(
  async (slug: string): Promise<StoryDetail | null> => {
    const encoded = encodeURIComponent(slug);
    return apiGet<StoryDetail>(`/api/stories/${encoded}`, {
      revalidate: REVALIDATE_STORIES_SECONDS,
      tags: [`story:${slug}`],
    });
  },
);

/** Fetch the paginated list of stories for the index page. */
type StoryListFilters = { domain?: StoryDomain };

export const listStories = cache(
  async (
    page = 1,
    limit = 20,
    filters?: StoryListFilters,
  ): Promise<Paginated<StorySummary>> => {
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("limit", String(limit));
    if (filters?.domain) {
      q.set("domain", filters.domain);
    }
    const result = await apiGet<Paginated<StorySummary>>(
      `/api/stories?${q.toString()}`,
      {
        revalidate: REVALIDATE_STORIES_SECONDS,
        tags: [
          "stories:list",
          ...(filters?.domain ? [`stories:domain:${filters.domain}`] : []),
        ],
      },
    );
    if (!result) {
      return {
        data: [],
        meta: { page, limit, total: 0, total_pages: 0 },
      };
    }
    return result;
  },
);

// -----------------------------------------------------------------------------
// Commissions
// -----------------------------------------------------------------------------

/**
 * Fetch the paginated list of commissions of inquiry. Used by the commissions
 * index page. We request the API's max page size (100) so we can render the
 * full editorial list in one pass — there are only ~21 national commissions
 * since 1994, so this is cheap and means the page renders sorted / filtered
 * client-side without needing infinite scroll.
 *
 * The 100 ceiling matches the API's `CommissionQueryDto` validation (set
 * there for DoS protection) — requesting more yields a 400 Bad Request.
 */
type CommissionListFilters = { domain?: CommissionDomain };

export const listCommissions = cache(
  async (
    page = 1,
    limit = 100,
    filters?: CommissionListFilters,
  ): Promise<Paginated<CommissionSummary>> => {
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("limit", String(limit));
    if (filters?.domain) {
      q.set("domain", filters.domain);
    }
    const result = await apiGet<Paginated<CommissionSummary>>(
      `/api/commissions?${q.toString()}`,
      {
        revalidate: REVALIDATE_STABLE_SECONDS,
        tags: [
          "commissions:list",
          ...(filters?.domain ? [`commissions:domain:${filters.domain}`] : []),
        ],
      },
    );
    if (!result) {
      return {
        data: [],
        meta: { page, limit, total: 0, total_pages: 0 },
      };
    }
    return result;
  },
);

/**
 * Fetch a full commission dossier by slug — stories, people, grouped law
 * sections, and the unified timeline. Returns `null` on 404 so the caller
 * can delegate to Next's `notFound()` helper.
 */
export const getCommission = cache(
  async (slug: string): Promise<CommissionDetail | null> => {
    const encoded = encodeURIComponent(slug);
    return apiGet<CommissionDetail>(`/api/commissions/${encoded}`, {
      revalidate: REVALIDATE_STABLE_SECONDS,
      tags: [`commission:${slug}`],
    });
  },
);

/**
 * Return the set of commissions OTHER than `slug` whose `people[]` intersects
 * with the given set of person IDs.
 *
 * NestJS doesn't currently expose a bulk endpoint for this, so we fetch the
 * list + every other commission's detail in parallel. With ~21 commissions
 * this is a cheap one-shot (and Next's request-level `cache()` + the hourly
 * revalidation for commission/detail fetches).
 *
 * The result is capped at {@link MAX_RELATED} rows to keep the UI compact.
 */
const MAX_RELATED = 6;

export const getRelatedBySamePeople = cache(
  async (
    slug: string,
    personIds: string[],
  ): Promise<Array<{ commission: CommissionSummary; shared_people: string[] }>> => {
    if (personIds.length === 0) return [];

    const personIdSet = new Set(personIds);

    const { data: all } = await listCommissions(1, 100);
    const siblings = all.filter((c) => c.slug !== slug);

    const details = await Promise.all(
      siblings.map(async (c) => {
        const detail = await getCommission(c.slug);
        return { sibling: c, detail };
      }),
    );

    const withOverlap = details
      .map(({ sibling, detail }) => {
        if (!detail) return null;
        const shared = detail.people
          .filter((p) => personIdSet.has(p.person_id))
          .map((p) => p.full_name);
        if (shared.length === 0) return null;
        // Deduplicate — one person can hold multiple roles on one commission.
        const dedupedShared = Array.from(new Set(shared));
        return { commission: sibling, shared_people: dedupedShared };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);

    withOverlap.sort((a, b) => b.shared_people.length - a.shared_people.length);
    return withOverlap.slice(0, MAX_RELATED);
  },
);

// -----------------------------------------------------------------------------
// Ad hoc committees
// -----------------------------------------------------------------------------

/**
 * Fetch the paginated list of National Assembly Ad Hoc Committees.
 *
 * Same shape as {@link listCommissions} — there are a small fixed number of
 * notable committees (~10 in the seed today, low double digits long-term),
 * so we pull the full set in one pass and let the index page tab+filter
 * client-side. The 100 ceiling matches the API's `AdhocCommitteeQueryDto`
 * validation.
 */
type AdhocListFilters = { domain?: CommissionDomain };

export const listAdhocCommittees = cache(
  async (
    page = 1,
    limit = 100,
    filters?: AdhocListFilters,
  ): Promise<Paginated<AdhocCommitteeSummary>> => {
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("limit", String(limit));
    if (filters?.domain) {
      q.set("domain", filters.domain);
    }
    const result = await apiGet<Paginated<AdhocCommitteeSummary>>(
      `/api/adhoc-committees?${q.toString()}`,
      {
        revalidate: REVALIDATE_STABLE_SECONDS,
        tags: [
          "adhoc-committees:list",
          ...(filters?.domain
            ? [`adhoc-committees:domain:${filters.domain}`]
            : []),
        ],
      },
    );
    if (!result) {
      return {
        data: [],
        meta: { page, limit, total: 0, total_pages: 0 },
      };
    }
    return result;
  },
);

/**
 * Fetch a full ad hoc committee dossier by slug — stories, people by role,
 * law sections by usage, related commission, unified timeline. Returns
 * `null` on 404.
 */
export const getAdhocCommittee = cache(
  async (slug: string): Promise<AdhocCommitteeDetail | null> => {
    const encoded = encodeURIComponent(slug);
    return apiGet<AdhocCommitteeDetail>(`/api/adhoc-committees/${encoded}`, {
      revalidate: REVALIDATE_STABLE_SECONDS,
      tags: [`adhoc-committee:${slug}`],
    });
  },
);

// -----------------------------------------------------------------------------
// People
// -----------------------------------------------------------------------------

/**
 * Fetch one person's complete public record — every story they're named in,
 * every commission they've appeared at, and every timeline event from those
 * stories. Returns `null` on 404 so the caller can delegate to `notFound()`.
 *
 * The API validates `:id` as a v4 UUID; anything else will fall into this
 * helper's 400 path and surface as an `ApiError`, which is what we want (a
 * bad URL should render the Next error boundary, not the 404 page).
 */
export const getPerson = cache(async (id: string): Promise<PersonDetail | null> => {
  const encoded = encodeURIComponent(id);
  return apiGet<PersonDetail>(`/api/people/${encoded}`, {
    revalidate: REVALIDATE_SEMI_STABLE_SECONDS,
    tags: [`person:${id}`],
  });
});

/** Paginated list of people — used for search and future index pages. */
export const listPeople = cache(
  async (page = 1, limit = 50): Promise<Paginated<PersonSummary>> => {
    const result = await apiGet<Paginated<PersonSummary>>(
      `/api/people?page=${page}&limit=${limit}`,
      {
        revalidate: REVALIDATE_SEMI_STABLE_SECONDS,
        tags: ["people:list"],
      },
    );
    if (!result) {
      return {
        data: [],
        meta: { page, limit, total: 0, total_pages: 0 },
      };
    }
    return result;
  },
);

// -----------------------------------------------------------------------------
// Legal — laws, sections, constitution
//
// `GET /api/legal/laws`                              → LawSummary[]
// `GET /api/legal/laws/:id`                          → LawWithSections
// `GET /api/legal/laws/:lawId/sections/:sectionId`   → LawSectionDetail
//
// The list endpoint isn't paginated server-side (there are only a few dozen
// statutes in scope), so we return the array directly. Section detail bundles
// every commission, ad hoc committee, and story that references the section
// in one round-trip — see `LawSectionDetail` in `@the-record/shared-types`.
// -----------------------------------------------------------------------------

/**
 * Fetch every tracked statute. The API returns the array unpaginated and
 * already sorted (`category` ASC, `short_name` ASC). Returns `[]` instead
 * of `null` so callers can render a "no laws yet" empty state without a
 * special-case branch — that should never happen in production but keeps
 * the type narrow for the page component.
 */
export const listLaws = cache(async (): Promise<LawSummary[]> => {
  const result = await apiGet<LawSummary[]>(`/api/legal/laws`, {
    revalidate: REVALIDATE_STABLE_SECONDS,
    tags: ["legal:laws:list"],
  });
  return result ?? [];
});

/**
 * Fetch a single law + every section belonging to it (sections ordered by
 * `section_number`). Returns `null` on 404 so the caller can delegate to
 * Next's `notFound()`.
 */
export const getLaw = cache(
  async (lawId: string): Promise<LawWithSections | null> => {
    const encoded = encodeURIComponent(lawId);
    return apiGet<LawWithSections>(`/api/legal/laws/${encoded}`, {
      revalidate: REVALIDATE_STABLE_SECONDS,
      tags: [`legal:law:${lawId}`],
    });
  },
);

/**
 * Fetch a section detail dossier — section + parent law + every commission,
 * ad hoc committee, and story that references it. Returns `null` on 404
 * (which the API uses both for "section not found" and for "section exists
 * but doesn't belong to that law", so the caller can collapse both into one
 * `notFound()` branch without leaking the distinction).
 */
export const getLawSection = cache(
  async (
    lawId: string,
    sectionId: string,
  ): Promise<LawSectionDetail | null> => {
    const encodedLaw = encodeURIComponent(lawId);
    const encodedSection = encodeURIComponent(sectionId);
    return apiGet<LawSectionDetail>(
      `/api/legal/laws/${encodedLaw}/sections/${encodedSection}`,
      {
        revalidate: REVALIDATE_STABLE_SECONDS,
        tags: [`legal:law-section:${sectionId}`],
      },
    );
  },
);

// -----------------------------------------------------------------------------
// SIU — Special Investigating Unit
//
// The SIU is a permanent statutory body activated per investigation by a
// Presidential Proclamation. Three endpoints power the /siu dashboard:
//   • GET /api/siu              — body singleton + headline stats
//   • GET /api/siu/proclamations — paginated list of proclamations
//   • GET /api/siu/tribunal      — Special Tribunal singleton + cases
//
// Each helper is wrapped in React's `cache()` for per-request dedupe and
// uses tag-based ISR so a re-seed of the SIU dataset can busts only the
// SIU cache and nothing else.
// -----------------------------------------------------------------------------

/**
 * Fetch the SIU body singleton + aggregate stats. Returns `null` if the
 * SIU dataset hasn't been seeded yet (the API responds 404 in that case)
 * so callers can render an explicit empty state rather than crashing.
 */
export const getSiuOverview = cache(
  async (): Promise<SiuOverviewResponse | null> => {
    return apiGet<SiuOverviewResponse>(`/api/siu`, {
      revalidate: REVALIDATE_SEMI_STABLE_SECONDS,
      tags: ["siu:overview"],
    });
  },
);

/**
 * Fetch all SIU proclamations. We request the API's max page size (100)
 * so the dashboard can render every row in a single pass — there are
 * fewer than 50 major proclamations since 1996, well under the ceiling.
 */
type SiuProclamationListFilters = { domain?: CommissionDomain };

export const listSiuProclamations = cache(
  async (
    page = 1,
    limit = 100,
    filters?: SiuProclamationListFilters,
  ): Promise<Paginated<SiuProclamationSummary>> => {
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("limit", String(limit));
    if (filters?.domain) {
      q.set("domain", filters.domain);
    }
    const result = await apiGet<Paginated<SiuProclamationSummary>>(
      `/api/siu/proclamations?${q.toString()}`,
      {
        revalidate: REVALIDATE_SEMI_STABLE_SECONDS,
        tags: [
          "siu:proclamations:list",
          ...(filters?.domain ? [`siu:proclamations:domain:${filters.domain}`] : []),
        ],
      },
    );
    if (!result) {
      return {
        data: [],
        meta: { page, limit, total: 0, total_pages: 0 },
      };
    }
    return result;
  },
);

/**
 * Fetch a single proclamation dossier by slug — outcome, tribunal cases,
 * stories, people, plus any cross-linked commission or ad hoc committee.
 * Returns `null` on 404 so the caller can delegate to `notFound()`.
 *
 * Currently unused by the index page, but exported here so detail pages
 * (and the referral-chain "tap to expand" experiments) can lean on the
 * same cached helper without duplicating fetch logic.
 */
export const getSiuProclamation = cache(
  async (slug: string): Promise<SiuProclamationDetail | null> => {
    const encoded = encodeURIComponent(slug);
    return apiGet<SiuProclamationDetail>(`/api/siu/proclamations/${encoded}`, {
      revalidate: REVALIDATE_SEMI_STABLE_SECONDS,
      tags: [`siu:proclamation:${slug}`],
    });
  },
);

/**
 * Fetch the Special Tribunal singleton + its full caseload. Cases come
 * pre-sorted by `value_rands DESC NULLS LAST` from the API — the
 * dashboard renders them in that order so the biggest cases lead.
 */
export const getSpecialTribunal = cache(
  async (): Promise<SpecialTribunalOverviewResponse | null> => {
    return apiGet<SpecialTribunalOverviewResponse>(`/api/siu/tribunal`, {
      revalidate: REVALIDATE_SEMI_STABLE_SECONDS,
      tags: ["siu:tribunal"],
    });
  },
);

// -----------------------------------------------------------------------------
// Global search (`GET /api/search`)
// -----------------------------------------------------------------------------

/**
 * Server-side search. Skips the network when the query is shorter than 2
 * characters (API returns 400). Returns `null` if the base URL is missing.
 */
export const searchGlobal = cache(
  async (
    q: string,
    options?: { types?: string; limit?: number; page?: number },
  ): Promise<SearchResponse | null> => {
    const trimmed = q.trim();
    if (trimmed.length < 2) return null;
    const p = new URLSearchParams();
    p.set("q", trimmed);
    if (options?.types) p.set("types", options.types);
    if (options?.limit != null) p.set("limit", String(options.limit));
    if (options?.page != null) p.set("page", String(options.page));
    return apiGet<SearchResponse>(`/api/search?${p.toString()}`, {
      cacheNoStore: true,
    });
  },
);

export const listYoutubeVideosForCommission = cache(
  async (commissionId: string): Promise<YoutubeVideo[]> => {
    const r = await apiGet<YoutubeVideo[]>(
      `/api/youtube/commission/${encodeURIComponent(commissionId)}`,
      {
        revalidate: REVALIDATE_STORIES_SECONDS,
        tags: [`youtube:commission:${commissionId}`],
      },
    );
    return r ?? [];
  },
);

export const listYoutubeVideosForAdhoc = cache(
  async (committeeId: string): Promise<YoutubeVideo[]> => {
    const r = await apiGet<YoutubeVideo[]>(
      `/api/youtube/adhoc-committee/${encodeURIComponent(committeeId)}`,
      {
        revalidate: REVALIDATE_STORIES_SECONDS,
        tags: [`youtube:adhoc:${committeeId}`],
      },
    );
    return r ?? [];
  },
);

// -----------------------------------------------------------------------------
// Provinces & municipalities
// -----------------------------------------------------------------------------

export const listProvinces = cache(async (): Promise<ProvinceListItem[]> => {
  const r = await apiGet<ProvinceListItem[]>(`/api/provinces`, {
    revalidate: REVALIDATE_SEMI_STABLE_SECONDS,
    tags: ["provinces:list"],
  });
  return r ?? [];
});

export const getProvince = cache(async (slug: string): Promise<ProvinceDetail | null> => {
  const enc = encodeURIComponent(slug);
  return apiGet<ProvinceDetail>(`/api/provinces/${enc}`, {
    revalidate: REVALIDATE_SEMI_STABLE_SECONDS,
    tags: [`province:${slug}`],
  });
});

export const getProvinceMoney = cache(
  async (slug: string): Promise<ProvinceMoneySummary | null> => {
    const enc = encodeURIComponent(slug);
    return apiGet<ProvinceMoneySummary>(`/api/provinces/${enc}/money`, {
      revalidate: REVALIDATE_SEMI_STABLE_SECONDS,
      tags: [`province:money:${slug}`],
    });
  },
);

export type ProvinceStoriesQuery = {
  page?: number;
  limit?: number;
  story_category?: StoryCategory;
  status?: string;
  sector?: string;
};

export const getProvinceStoriesPage = cache(
  async (slug: string, query?: ProvinceStoriesQuery): Promise<ProvinceStoriesPage | null> => {
    const enc = encodeURIComponent(slug);
    const q = new URLSearchParams();
    if (query?.page != null) q.set("page", String(query.page));
    if (query?.limit != null) q.set("limit", String(query.limit));
    if (query?.story_category != null) q.set("story_category", query.story_category);
    if (query?.status != null) q.set("status", query.status);
    if (query?.sector != null) q.set("sector", query.sector);
    const qs = q.toString();
    const path = `/api/provinces/${enc}/stories${qs ? `?${qs}` : ""}`;
    return apiGet<ProvinceStoriesPage>(path, {
      revalidate: REVALIDATE_STORIES_SECONDS,
      tags: [`province:stories:${slug}`],
    });
  },
);

export const getMunicipality = cache(
  async (slug: string): Promise<MunicipalityDetail | null> => {
    const enc = encodeURIComponent(slug);
    return apiGet<MunicipalityDetail>(`/api/municipalities/${enc}`, {
      revalidate: REVALIDATE_SEMI_STABLE_SECONDS,
      tags: [`municipality:${slug}`],
    });
  },
);

export const listYoutubeVideosForStory = cache(
  async (storyId: string): Promise<YoutubeVideo[]> => {
    const r = await apiGet<YoutubeVideo[]>(
      `/api/youtube/story/${encodeURIComponent(storyId)}`,
      {
        revalidate: REVALIDATE_STORIES_SECONDS,
        tags: [`youtube:story:${storyId}`],
      },
    );
    return r ?? [];
  },
);
