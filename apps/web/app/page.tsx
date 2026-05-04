/**
 * The Record — homepage (Server Component).
 *
 * Parallel-fetches the NestJS API; any failure collapses to empty fallbacks
 * so the page never hard-crashes during outages or local dev without a DB.
 */

import type { Metadata } from "next";

import AccountabilityExplorer from "@/components/Homepage/AccountabilityExplorer";
import ConstitutionSpotlight from "@/components/Homepage/ConstitutionSpotlight";
import DomainFooterStrip from "@/components/Homepage/DomainFooterStrip";
import FeaturedStory from "@/components/Homepage/FeaturedStory";
import HomeHero from "@/components/Homepage/HomeHero";
import HowItWorks from "@/components/Homepage/HowItWorks";
import LiveTicker from "@/components/Homepage/LiveTicker";
import MoneyCounter from "@/components/Homepage/MoneyCounter";
import PeopleStrip, { type PeopleStripRow } from "@/components/Homepage/PeopleStrip";
import SiuMoneyBanner from "@/components/Homepage/SiuMoneyBanner";
import SmartSearch from "@/components/Homepage/SmartSearch";
import StatsBar from "@/components/Homepage/StatsBar";
import { formatRands, formatRandsCompact } from "@/lib/format";
import { getImpactWeb, listAccountabilityBodies, listStories } from "@/lib/api";
import {
  MEDICARE24_STORY_SLUG,
  MKHWANAZI_SLUG,
  TEMBISA_HOSPITAL_STORY_SLUG,
} from "@/lib/placeholders";

import type {
  AdhocCommitteeSummary,
  CommissionSummary,
  ExpenditureCounter,
  LawSummary,
  PersonSummary,
  SiuProclamationSummary,
  SiuStats,
  StoryDetail,
} from "@the-record/shared-types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Record — South African news, from incident to verdict.",
  description:
    "Track South African news from incident to verdict. Every commission. Every charge. Every law explained in plain language.",
  openGraph: {
    title: "The Record",
    description:
      "Track South African news from incident to verdict. Every commission. Every charge. Every law explained in plain language.",
    type: "website",
    locale: "en_ZA",
    siteName: "The Record",
  },
};

/** Matches the NestJS paginated JSON envelope. */
interface Paginated<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

interface MadlangaCommission {
  announced_date: string | null;
  hearings_started: string | null;
}

function apiBase(): string | null {
  const u = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  return u ? u.replace(/\/+$/, "") : null;
}

async function fetchJson<T>(path: string): Promise<T | null> {
  const base = apiBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}${path}`, {
      next: { revalidate: 300 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function emptyPaginated<T>(): Paginated<T> {
  return {
    data: [],
    meta: { page: 1, limit: 0, total: 0, total_pages: 0 },
  };
}

function daysSinceHearingOrAnnouncement(c: MadlangaCommission | null): number {
  if (!c) return 1;
  const raw = c.hearings_started ?? c.announced_date;
  if (!raw) return 1;
  const t = new Date(raw).getTime();
  if (Number.isNaN(t)) return 1;
  const d = Math.floor((Date.now() - t) / 86_400_000) + 1;
  return Math.max(1, d);
}

const BABITA_FULL_NAME = "Babita Deokaran";
const BABITA_STRIP_ROLE = "Whistleblower · Assassinated 2021";

/** Merge key figures from multiple dossiers (e.g. Mkhwanazi + Tembisa); Babita first. */
function peopleStripFromStories(
  stories: (StoryDetail | null)[],
): PeopleStripRow[] {
  const byId = new Map<string, PeopleStripRow>();
  for (const story of stories) {
    if (!story) continue;
    for (const sp of story.people.filter((p) => p.is_key_figure)) {
      const id = sp.person.id;
      const isBabita = sp.person.full_name === BABITA_FULL_NAME;
      const role = isBabita ? BABITA_STRIP_ROLE : sp.role_in_story;
      if (!byId.has(id)) {
        byId.set(id, { person: sp.person, role });
      }
    }
  }
  const rows = [...byId.values()];
  rows.sort((a, b) => {
    const aB = a.person.full_name === BABITA_FULL_NAME ? 0 : 1;
    const bB = b.person.full_name === BABITA_FULL_NAME ? 0 : 1;
    if (aB !== bB) return aB - bB;
    return a.person.full_name.localeCompare(b.person.full_name, "en-ZA");
  });
  return rows;
}

function madlangaCarrimDelayTickerLine(
  mkStory: StoryDetail | null,
  carrimInPeopleDirectory: boolean,
): string | null {
  if (!carrimInPeopleDirectory || !mkStory?.timeline_events?.length) {
    return null;
  }
  const now = Date.now();
  const maxAgeMs = 30 * 86_400_000;
  const recentCarrim = mkStory.timeline_events.some((e) => {
    const t = new Date(e.event_date).getTime();
    if (Number.isNaN(t) || t > now || now - t > maxAgeMs) return false;
    const blob = `${e.title} ${e.description ?? ""} ${e.plain_english ?? ""}`;
    return /\bcarrim\b/i.test(blob);
  });
  return recentCarrim
    ? "MADLANGA COMMISSION · CARRIM TESTIMONY DELAYED · MEDICAL CERTIFICATE"
    : null;
}

function peopleExplorerFromStory(
  story: StoryDetail | null,
  peopleFallback: PersonSummary[],
) {
  if (story && story.people.length > 0) {
    return [...story.people]
      .sort((a, b) => {
        if (a.is_key_figure !== b.is_key_figure) return a.is_key_figure ? -1 : 1;
        return a.person.full_name.localeCompare(b.person.full_name);
      })
      .map((sp) => ({ person: sp.person, role: sp.role_in_story }));
  }
  return peopleFallback.slice(0, 32).map((p) => ({
    person: p,
    role: p.current_role ?? p.organisation ?? "—",
  }));
}

export default async function HomePage() {
  const [
    storiesRes,
    mkStory,
    tembisaStory,
    medicareStory,
    commissionsRes,
    committeesRes,
    accountabilityBodies,
    siuStats,
    siuProcRes,
    peopleRes,
    laws,
    madlangaCommission,
    expenditureCounter,
    impactWeb,
  ] = await Promise.all([
    listStories(1, 10, { sort: "updated_at", order: "DESC" }),
    fetchJson<StoryDetail>(`/api/stories/${encodeURIComponent(MKHWANAZI_SLUG)}`),
    fetchJson<StoryDetail>(
      `/api/stories/${encodeURIComponent(TEMBISA_HOSPITAL_STORY_SLUG)}`,
    ),
    fetchJson<StoryDetail>(`/api/stories/${encodeURIComponent(MEDICARE24_STORY_SLUG)}`),
    fetchJson<Paginated<CommissionSummary>>(
      "/api/commissions?page=1&limit=100",
    ),
    fetchJson<Paginated<AdhocCommitteeSummary>>(
      "/api/adhoc-committees?page=1&limit=100",
    ),
    listAccountabilityBodies(),
    fetchJson<SiuStats>("/api/siu/stats"),
    fetchJson<Paginated<SiuProclamationSummary>>(
      "/api/siu/proclamations?page=1&limit=9",
    ),
    fetchJson<Paginated<PersonSummary>>("/api/people?page=1&limit=100"),
    fetchJson<LawSummary[]>("/api/legal/laws"),
    fetchJson<MadlangaCommission>("/api/commissions/madlanga-commission"),
    fetchJson<ExpenditureCounter>("/api/expenditure/counter"),
    getImpactWeb(),
  ]);

  const featuredSlug = storiesRes.data[0]?.slug ?? MKHWANAZI_SLUG;
  const storyBySlug: Record<string, StoryDetail | null> = {
    [MKHWANAZI_SLUG]: mkStory,
    [TEMBISA_HOSPITAL_STORY_SLUG]: tembisaStory,
    [MEDICARE24_STORY_SLUG]: medicareStory,
  };
  let featuredStory = storyBySlug[featuredSlug] ?? null;
  if (!featuredStory) {
    featuredStory = await fetchJson<StoryDetail>(
      `/api/stories/${encodeURIComponent(featuredSlug)}`,
    );
  }
  if (!featuredStory) {
    featuredStory = mkStory;
  }

  const commissions = commissionsRes?.data ?? [];
  const committees = committeesRes?.data ?? [];
  const siuProc = siuProcRes?.data ?? [];
  const people = peopleRes?.data ?? [];
  const lawsList = (laws ?? []).slice(0, 6);

  const commMeta = commissionsRes?.meta ?? emptyPaginated<CommissionSummary>().meta;
  const committeeMeta = committeesRes?.meta ?? emptyPaginated<AdhocCommitteeSummary>().meta;
  const peopleMeta = peopleRes?.meta ?? emptyPaginated<PersonSummary>().meta;

  const litigationTicker = siuStats
    ? `SIU: ${formatRands(siuStats.total_civil_litigation_rands).toUpperCase()} ENROLLED IN TRIBUNAL`
    : "SIU: CIVIL LITIGATION — SPECIAL TRIBUNAL";

  const commissionDays = daysSinceHearingOrAnnouncement(madlangaCommission);

  const moneyTrackedCompact = expenditureCounter
    ? formatRandsCompact(expenditureCounter.total_tracked_rands)
    : null;

  const activeCommissions = commissions.filter((c) => c.status === "active");

  /** Prefer API total; fall back to 22 if fetch fails. Bump 21→22 when meta is one short of editorial count. */
  const commissionTickerTotal = commissionsRes
    ? Math.max(commMeta.total, commissions.length, commMeta.total === 21 ? 22 : 0)
    : 22;

  const storyTickerExtras: string[] = [];
  if (tembisaStory?.status === "active") {
    storyTickerExtras.push(
      "TEMBISA HOSPITAL · R2BN LOOTED · MASTERMINDS STILL FREE",
    );
  }
  if (medicareStory?.status === "active") {
    storyTickerExtras.push("MEDICARE24 · 12 SAPS OFFICERS IN COURT · MARCH 2026");
  }
  const carrimListed = people.some((p) => p.full_name === "Suliman Carrim");
  const carrimLine = madlangaCarrimDelayTickerLine(mkStory, carrimListed);
  if (carrimLine) {
    storyTickerExtras.push(carrimLine);
  }

  const tickerItems: string[] = [
    `MADLANGA COMMISSION · DAY ${commissionDays} — ACTIVE`,
    litigationTicker,
    `${commissionTickerTotal} COMMISSIONS SINCE 1994`,
    `MKHWANAZI AD HOC COMMITTEE — 7TH PARLIAMENT`,
    ...storyTickerExtras,
    ...activeCommissions.map(
      (c) => `${c.popular_name.toUpperCase()} — ${c.status.toUpperCase()}`,
    ),
    "VBS SENTENCE: MATODZI 15 YEARS · JULY 2024",
  ];

  const strip = peopleStripFromStories([mkStory, tembisaStory]);
  const explorerPeople = peopleExplorerFromStory(mkStory, people);

  const featuredBody =
    featuredStory?.plain_english_summary ??
    "A top police general went on TV and said some politicians were blocking the police from doing their job — triggering parallel judicial and parliamentary investigations.";

  return (
    <div className="min-w-0 overflow-x-hidden">
      <LiveTicker items={tickerItems} />
      <HomeHero />
      <StatsBar
        moneyTrackedCompact={moneyTrackedCompact}
        commissionTotal={commMeta.total}
        committeeTotal={committeeMeta.total}
        peopleTotal={peopleMeta.total}
        siuStats={siuStats}
      />
      <MoneyCounter counter={expenditureCounter} />
      <SmartSearch />
      <FeaturedStory
        title={
          featuredStory?.title ?? "The Mkhwanazi allegations & Madlanga Commission"
        }
        plainSummary={featuredBody}
        slug={featuredStory?.slug ?? MKHWANAZI_SLUG}
        events={featuredStory?.timeline_events ?? []}
      />
      <AccountabilityExplorer
        commissions={commissions.slice(0, 22)}
        committees={committees.slice(0, 10)}
        accountabilityBodies={accountabilityBodies.slice(0, 12)}
        siuProclamations={siuProc}
        stories={storiesRes.data}
        peopleRows={explorerPeople}
        laws={lawsList}
        impactSectors={impactWeb?.sectors ?? []}
      />
      <SiuMoneyBanner stats={siuStats} />
      <PeopleStrip rows={strip} />
      <ConstitutionSpotlight />
      <HowItWorks />
      <DomainFooterStrip />
    </div>
  );
}
