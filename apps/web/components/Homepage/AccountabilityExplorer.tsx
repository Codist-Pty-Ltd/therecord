"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import ImpactExplorerGrid from "@/components/Homepage/ImpactExplorerGrid";
import {
  AdhocRowList,
  BodiesRowList,
  CommissionsRowList,
  SiuProclamationsRowList,
} from "@/components/Accountability/ExplorerRowLists";
import { getPersonInitials, getStatusColour } from "@/lib/format";

import type {
  AccountabilityBody,
  AdhocCommitteeSummary,
  CommissionSummary,
  LawSummary,
  PersonSummary,
  SiuProclamationSummary,
  ImpactWebSectorNode,
  StorySummary,
} from "@the-record/shared-types";

import type { ExplorerTab } from "./StatsBar";

export interface PeopleExplorerRow {
  person: PersonSummary;
  role: string;
}

export interface AccountabilityExplorerProps {
  commissions: CommissionSummary[];
  committees: AdhocCommitteeSummary[];
  accountabilityBodies: AccountabilityBody[];
  siuProclamations: SiuProclamationSummary[];
  /** Most recently updated active stories (homepage uses limit 10, `sort=updated_at`). */
  stories: StorySummary[];
  peopleRows: PeopleExplorerRow[];
  laws: LawSummary[];
  impactSectors: ImpactWebSectorNode[];
}

const TABS: { id: ExplorerTab; label: string }[] = [
  { id: "commissions", label: "Commissions" },
  { id: "adhoc", label: "Ad Hoc" },
  { id: "special_units", label: "Special Units" },
  { id: "siu", label: "SIU" },
  { id: "stories", label: "Stories" },
  { id: "people", label: "People" },
  { id: "laws", label: "Laws" },
  { id: "impact", label: "Impact" },
];

export default function AccountabilityExplorer({
  commissions,
  committees,
  accountabilityBodies,
  siuProclamations,
  stories,
  peopleRows,
  laws,
  impactSectors,
}: AccountabilityExplorerProps) {
  const [tab, setTab] = useState<ExplorerTab>("commissions");
  const prefersReduced = useReducedMotion() ?? false;

  const onSetTab = useCallback((e: Event) => {
    const detail = (e as CustomEvent<ExplorerTab>).detail;
    if (detail) setTab(detail);
  }, []);

  useEffect(() => {
    window.addEventListener("home-explorer-set-tab", onSetTab);
    return () => window.removeEventListener("home-explorer-set-tab", onSetTab);
  }, [onSetTab]);

  const count = useMemo(() => {
    switch (tab) {
      case "commissions":
        return commissions.length;
      case "adhoc":
        return committees.length;
      case "special_units":
        return accountabilityBodies.length;
      case "siu":
        return siuProclamations.length;
      case "stories":
        return stories.length;
      case "people":
        return peopleRows.length;
      case "laws":
        return laws.length;
      case "impact":
        return impactSectors.length;
      default:
        return 0;
    }
  }, [
    tab,
    commissions,
    committees,
    accountabilityBodies,
    siuProclamations,
    stories,
    peopleRows,
    laws,
    impactSectors,
  ]);

  return (
    <section
      id="explorer-anchor"
      className="bg-cream border-t border-charcoal/10"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-14">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-serif text-[22px] text-charcoal">
            30 Years of Accountability
          </h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-charcoal/50">
            {count} records
          </p>
        </div>

        <div
          className="mt-5 -mx-0 overflow-x-auto scrollbar-hidden pb-1"
          role="tablist"
          aria-label="Browse accountability records"
        >
          <div className="flex min-w-max gap-0 border-b border-charcoal/10">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`explorer-tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls={`explorer-panel-${t.id}`}
                onClick={() => setTab(t.id)}
                className={[
                  "relative min-h-[44px] px-4 pb-2 pt-1 font-sans text-sm transition-colors",
                  tab === t.id
                    ? "text-charcoal font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber"
                    : "text-charcoal/50 hover:text-charcoal/75",
                ].join(" ")}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 min-h-[200px]">
          <AnimatePresence mode="wait">
            <ExplorerPanel key={tab} tab={tab} prefersReduced={prefersReduced}>
              {tab === "commissions" && (
                <CommissionsRowList rows={commissions} />
              )}
              {tab === "adhoc" && <AdhocRowList rows={committees} />}
              {tab === "special_units" && <BodiesRowList rows={accountabilityBodies} />}
              {tab === "siu" && <SiuProclamationsRowList rows={siuProclamations} />}
              {tab === "stories" && <StoriesList rows={stories} />}
              {tab === "people" && <PeopleList rows={peopleRows} />}
              {tab === "laws" && <LawsList rows={laws} />}
              {tab === "impact" && <ImpactExplorerGrid sectors={impactSectors} />}
            </ExplorerPanel>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function ExplorerPanel({
  children,
  tab,
  prefersReduced,
}: {
  children: React.ReactNode;
  tab: ExplorerTab;
  prefersReduced: boolean;
}) {
  return (
    <motion.div
      role="tabpanel"
      id={`explorer-panel-${tab}`}
      aria-labelledby={`explorer-tab-${tab}`}
      initial={prefersReduced ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={prefersReduced ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: prefersReduced ? 0 : 0.2 }}
    >
      {children}
    </motion.div>
  );
}

function StoriesList({ rows }: { rows: StorySummary[] }) {
  if (rows.length === 0) {
    return <PeopleLawsEmptyHint />;
  }
  return (
    <ul className="divide-y divide-charcoal/10">
      {rows.map((story) => (
        <li key={story.id}>
          <Link
            href={`/story/${story.slug}`}
            className="block min-h-[48px] py-3 transition hover:bg-amber/[0.04] first:pt-0"
          >
            <p className="text-sm font-medium text-charcoal">{story.title}</p>
            <p className="font-mono text-[9px] uppercase tracking-wider text-charcoal/45">
              {story.domain.replace(/_/g, " ")} · updated{" "}
              {new Intl.DateTimeFormat("en-ZA", {
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: "Africa/Johannesburg",
              }).format(new Date(story.updated_at))}
            </p>
            {story.plain_english_summary ? (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-charcoal/65">
                {story.plain_english_summary}
              </p>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function PeopleList({ rows }: { rows: PeopleExplorerRow[] }) {
  if (rows.length === 0) {
    return <PeopleLawsEmptyHint />;
  }
  return (
    <ul className="divide-y divide-charcoal/10">
      {rows.map(({ person, role }) => (
        <li key={person.id}>
          <Link
            href={`/person/${person.id}`}
            className="flex min-h-[48px] items-center gap-3 py-2 transition hover:bg-amber/[0.04] first:pt-0"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-cream"
              style={{ backgroundColor: getStatusColour(person.status) }}
            >
              {getPersonInitials(person.full_name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-charcoal">
                {person.full_name}
              </p>
              <p className="font-mono text-[9px] uppercase tracking-wider text-charcoal/45">
                {role}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function LawsList({ rows }: { rows: LawSummary[] }) {
  if (rows.length === 0) {
    return <PeopleLawsEmptyHint />;
  }
  return (
    <ul className="divide-y divide-charcoal/10">
      {rows.map((law) => (
        <li key={law.id}>
          <Link
            href={`/laws#${law.id}`}
            className="block min-h-[48px] py-3 transition hover:bg-amber/[0.04] first:pt-0"
          >
            <p className="font-mono text-sm text-legal-blue">{law.short_name}</p>
            <p className="text-sm font-medium text-charcoal">{law.name}</p>
            <p className="text-xs text-charcoal/50">{law.act_number}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-charcoal/65">
              {law.plain_english}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function PeopleLawsEmptyHint() {
  return (
    <p className="text-sm text-charcoal/55 py-6">No records in this list yet.</p>
  );
}
