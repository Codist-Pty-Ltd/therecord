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
import PeopleStrip from "@/components/Homepage/PeopleStrip";
import SiuMoneyBanner from "@/components/Homepage/SiuMoneyBanner";
import SmartSearch from "@/components/Homepage/SmartSearch";
import StatsBar from "@/components/Homepage/StatsBar";
import { formatRands } from "@/lib/format";
import { MKHWANAZI_SLUG } from "@/lib/placeholders";

import type {
  AdhocCommitteeSummary,
  CommissionSummary,
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

function peopleStripFromStory(story: StoryDetail | null) {
  if (!story) return [];
  return story.people
    .filter((sp) => sp.is_key_figure)
    .map((sp) => ({ person: sp.person, role: sp.role_in_story }))
    .sort((a, b) => a.person.full_name.localeCompare(b.person.full_name));
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
    story,
    commissionsRes,
    committeesRes,
    siuStats,
    siuProcRes,
    peopleRes,
    laws,
    madlangaCommission,
  ] = await Promise.all([
    fetchJson<StoryDetail>(`/api/stories/${encodeURIComponent(MKHWANAZI_SLUG)}`),
    fetchJson<Paginated<CommissionSummary>>(
      "/api/commissions?page=1&limit=100",
    ),
    fetchJson<Paginated<AdhocCommitteeSummary>>(
      "/api/adhoc-committees?page=1&limit=100",
    ),
    fetchJson<SiuStats>("/api/siu/stats"),
    fetchJson<Paginated<SiuProclamationSummary>>(
      "/api/siu/proclamations?page=1&limit=9",
    ),
    fetchJson<Paginated<PersonSummary>>("/api/people?page=1&limit=100"),
    fetchJson<LawSummary[]>("/api/legal/laws"),
    fetchJson<MadlangaCommission>("/api/commissions/madlanga-commission"),
  ]);

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

  const activeCommissions = commissions.filter((c) => c.status === "active");

  const tickerItems: string[] = [
    `MADLANGA COMMISSION · DAY ${commissionDays} — ACTIVE`,
    litigationTicker,
    `${commMeta.total} COMMISSIONS SINCE 1994`,
    `MKHWANAZI AD HOC COMMITTEE — 7TH PARLIAMENT`,
    ...activeCommissions.map(
      (c) => `${c.popular_name.toUpperCase()} — ${c.status.toUpperCase()}`,
    ),
    "VBS SENTENCE: MATODZI 15 YEARS · JULY 2024",
  ];

  const strip = peopleStripFromStory(story);
  const explorerPeople = peopleExplorerFromStory(story, people);

  const featuredBody =
    story?.plain_english_summary ??
    "A top police general went on TV and said some politicians were blocking the police from doing their job — triggering parallel judicial and parliamentary investigations.";

  return (
    <div className="min-w-0 overflow-x-hidden">
      <LiveTicker items={tickerItems} />
      <HomeHero />
      <StatsBar
        commissionTotal={commMeta.total}
        committeeTotal={committeeMeta.total}
        peopleTotal={peopleMeta.total}
        siuStats={siuStats}
      />
      <SmartSearch />
      <FeaturedStory
        title={story?.title ?? "The Mkhwanazi allegations & Madlanga Commission"}
        plainSummary={featuredBody}
        slug={MKHWANAZI_SLUG}
        events={story?.timeline_events ?? []}
      />
      <AccountabilityExplorer
        commissions={commissions.slice(0, 22)}
        committees={committees.slice(0, 10)}
        siuProclamations={siuProc}
        peopleRows={explorerPeople}
        laws={lawsList}
      />
      <SiuMoneyBanner stats={siuStats} />
      <PeopleStrip rows={strip} />
      <ConstitutionSpotlight />
      <HowItWorks />
      <DomainFooterStrip />
    </div>
  );
}
