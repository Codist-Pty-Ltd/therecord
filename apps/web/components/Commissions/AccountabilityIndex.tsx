"use client";

/**
 * AccountabilityIndex — the tabbed editorial index that replaces the older
 * single-list `CommissionsIndex`. It now shows BOTH commissions of inquiry
 * (executive, Section 84(2)(f)) and ad hoc parliamentary committees
 * (legislative, NA Rule 253) — separated by an underline tab bar so the
 * constitutional distinction stays visible at the top of the page.
 *
 * Behaviour:
 *   • Two tabs at the top — "Commissions of Inquiry" (default) and
 *     "Ad Hoc Committees". Switching tabs cross-fades the list via
 *     `AnimatePresence`.
 *   • The domain-filter chip bar sits below the tabs and filters the
 *     ACTIVE tab only — domains that don't appear in the active tab's
 *     dataset are hidden so we never show ghost filters.
 *   • Each list renders editorial rows (no card grids). Row stagger uses
 *     the same Framer Motion settings as the legacy index.
 *
 * State stays client-side: server already shipped both full datasets in
 * one round-trip via `Promise.all`, so tab/filter changes are instant.
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";

import type {
  AdhocCommitteeSummary,
  CommissionDomain,
  CommissionSummary,
} from "@the-record/shared-types";

import {
  accountabilityActionDescriptor,
  ADHOC_CATEGORY_LABELS,
  adhocCategoryChipClasses,
  adhocEraYear,
  adhocStatusBadgeClasses,
} from "@/lib/adhoc";
import {
  COMMISSION_DOMAIN_LABELS,
  commissionEraYear,
  domainChipClasses,
  prosecutionDescriptor,
  statusBadgeClasses,
} from "@/lib/commissions";

type TabId = "commissions" | "committees";

interface AccountabilityIndexProps {
  commissions: CommissionSummary[];
  committees: AdhocCommitteeSummary[];
  /** Open the Ad Hoc tab first (e.g. `/commissions?tab=adhoc`). */
  initialTab?: TabId;
}

type DomainFilter = "all" | CommissionDomain;

/**
 * Editorial chip order — fixed so the bar is stable across tab switches,
 * but only chips with at least one row in the active tab actually render.
 */
const DOMAIN_FILTER_ORDER: CommissionDomain[] = [
  "criminal_justice",
  "corruption",
  "financial",
  "human_rights",
  "policing",
  "education",
  "public_safety",
  "politics",
  "organised_crime",
  "business",
  "labour",
];

// =============================================================================
// Main component
// =============================================================================

export default function AccountabilityIndex({
  commissions,
  committees,
  initialTab = "commissions",
}: AccountabilityIndexProps) {
  const [tab, setTab] = useState<TabId>(initialTab);
  const prefersReduced = useReducedMotion() ?? false;
  const [domain, setDomain] = useState<DomainFilter>("all");

  // Reset the domain filter when switching tabs — a chip valid for one tab
  // may be empty in the other and we don't want a "0 results" landing.
  const switchTab = (next: TabId) => {
    setTab(next);
    setDomain("all");
  };

  // ── commission derivations ────────────────────────────────────────────────
  const commissionDomainCounts = useMemo(() => {
    const counts = new Map<CommissionDomain, number>();
    for (const c of commissions) {
      counts.set(c.domain, (counts.get(c.domain) ?? 0) + 1);
    }
    return counts;
  }, [commissions]);

  const sortedCommissions = useMemo(() => {
    return [...commissions].sort((a, b) => {
      const ya = Number(commissionEraYear(a));
      const yb = Number(commissionEraYear(b));
      if (Number.isFinite(ya) && Number.isFinite(yb) && ya !== yb) return yb - ya;
      return a.popular_name.localeCompare(b.popular_name);
    });
  }, [commissions]);

  const visibleCommissions = useMemo(() => {
    if (domain === "all") return sortedCommissions;
    return sortedCommissions.filter((c) => c.domain === domain);
  }, [sortedCommissions, domain]);

  // ── committee derivations ─────────────────────────────────────────────────
  const committeeDomainCounts = useMemo(() => {
    const counts = new Map<CommissionDomain, number>();
    for (const c of committees) {
      counts.set(c.domain, (counts.get(c.domain) ?? 0) + 1);
    }
    return counts;
  }, [committees]);

  const sortedCommittees = useMemo(() => {
    return [...committees].sort((a, b) => {
      const ya = Number(adhocEraYear(a));
      const yb = Number(adhocEraYear(b));
      if (Number.isFinite(ya) && Number.isFinite(yb) && ya !== yb) return yb - ya;
      return a.popular_name.localeCompare(b.popular_name);
    });
  }, [committees]);

  const visibleCommittees = useMemo(() => {
    if (domain === "all") return sortedCommittees;
    return sortedCommittees.filter((c) => c.domain === domain);
  }, [sortedCommittees, domain]);

  // ── filter bar inputs (depend on the active tab) ──────────────────────────
  const activeDomainCounts =
    tab === "commissions" ? commissionDomainCounts : committeeDomainCounts;
  const activeTotal = tab === "commissions" ? commissions.length : committees.length;
  const activeVisibleCount =
    tab === "commissions" ? visibleCommissions.length : visibleCommittees.length;

  const visibleDomains = useMemo(
    () =>
      DOMAIN_FILTER_ORDER.filter((d) => (activeDomainCounts.get(d) ?? 0) > 0),
    [activeDomainCounts],
  );

  return (
    <section aria-label="Accountability bodies" className="bg-cream">
      <TabBar tab={tab} onChange={switchTab} commissionCount={commissions.length} committeeCount={committees.length} />

      <div
        role="tabpanel"
        id={tab === "commissions" ? "panel-commissions" : "panel-committees"}
        aria-labelledby={
          tab === "commissions" ? "tab-commissions" : "tab-committees"
        }
      >
        <FilterBar
          visibleDomains={visibleDomains}
          domainCounts={activeDomainCounts}
          totalCount={activeTotal}
          active={domain}
          onChange={setDomain}
        />

        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <ResultsSummary
            tab={tab}
            count={activeVisibleCount}
            total={activeTotal}
            activeDomain={domain}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={`${tab}:${domain}`}
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={prefersReduced ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: prefersReduced ? 0 : 0.2, ease: "easeOut" }}
            >
              {tab === "commissions" ? (
                visibleCommissions.length > 0 ? (
                  <ul className="flex flex-col">
                    {visibleCommissions.map((c, idx) => (
                      <CommissionRow key={c.id} commission={c} index={idx} />
                    ))}
                  </ul>
                ) : (
                  <EmptyState bodyKind="commissions" />
                )
              ) : visibleCommittees.length > 0 ? (
                <ul className="flex flex-col">
                  {visibleCommittees.map((c, idx) => (
                    <CommitteeRow key={c.id} committee={c} index={idx} />
                  ))}
                </ul>
              ) : (
                <EmptyState bodyKind="committees" />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// Tab bar (underline style — not pill)
// =============================================================================

interface TabBarProps {
  tab: TabId;
  onChange: (next: TabId) => void;
  commissionCount: number;
  committeeCount: number;
}

function TabBar({ tab, onChange, commissionCount, committeeCount }: TabBarProps) {
  return (
    <div className="border-b border-charcoal/10 bg-cream">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div
          role="tablist"
          aria-label="Accountability body type"
          className="flex items-end gap-6 md:gap-10"
        >
          <TabButton
            id="tab-commissions"
            controls="panel-commissions"
            isActive={tab === "commissions"}
            onClick={() => onChange("commissions")}
            label="Commissions of Inquiry"
            count={commissionCount}
          />
          <TabButton
            id="tab-committees"
            controls="panel-committees"
            isActive={tab === "committees"}
            onClick={() => onChange("committees")}
            label="Ad Hoc Committees"
            count={committeeCount}
          />
        </div>
      </div>
    </div>
  );
}

interface TabButtonProps {
  id: string;
  controls: string;
  isActive: boolean;
  onClick: () => void;
  label: string;
  count: number;
}

function TabButton({ id, controls, isActive, onClick, label, count }: TabButtonProps) {
  return (
    <button
      type="button"
      id={id}
      role="tab"
      aria-selected={isActive}
      aria-controls={controls}
      tabIndex={isActive ? 0 : -1}
      onClick={onClick}
      className={[
        "group relative -mb-px pt-4 pb-3 md:pt-5 md:pb-4",
        "border-b-2 transition-colors duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/40 focus-visible:rounded",
        isActive
          ? "border-amber text-charcoal"
          : "border-transparent text-charcoal/55 hover:text-charcoal/85",
      ].join(" ")}
    >
      <span className="font-serif text-[16px] md:text-[19px] leading-none">
        {label}
      </span>
      <span
        aria-hidden
        className={[
          "ml-2 align-middle inline-flex items-center justify-center",
          "font-mono text-[10px] md:text-[11px]",
          isActive ? "text-amber" : "text-charcoal/40",
        ].join(" ")}
      >
        {count}
      </span>
    </button>
  );
}

// =============================================================================
// Domain filter bar (sticky)
// =============================================================================

interface FilterBarProps {
  visibleDomains: CommissionDomain[];
  domainCounts: Map<CommissionDomain, number>;
  totalCount: number;
  active: DomainFilter;
  onChange: (v: DomainFilter) => void;
}

function FilterBar({
  visibleDomains,
  domainCounts,
  totalCount,
  active,
  onChange,
}: FilterBarProps) {
  return (
    <div
      aria-label="Filter by domain"
      className={[
        "sticky top-0 z-20",
        "bg-cream/95 backdrop-blur",
        "border-b border-charcoal/10",
      ].join(" ")}
    >
      <div className="max-w-6xl mx-auto">
        <div className="-mx-0 overflow-x-auto scrollbar-hidden">
          <div className="flex items-center gap-2 px-4 md:px-8 py-3 md:py-4">
            <FilterChip
              label="All"
              count={totalCount}
              isActive={active === "all"}
              onClick={() => onChange("all")}
            />
            {visibleDomains.map((d) => (
              <FilterChip
                key={d}
                label={COMMISSION_DOMAIN_LABELS[d]}
                count={domainCounts.get(d) ?? 0}
                isActive={active === d}
                onClick={() => onChange(d)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  label,
  count,
  isActive,
  onClick,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={[
        "shrink-0 inline-flex items-center gap-2 whitespace-nowrap",
        "px-3.5 md:px-4 py-1.5 md:py-2 rounded-full",
        "font-mono text-[11px] md:text-xs uppercase tracking-[0.14em]",
        "border transition-colors duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/40",
        isActive
          ? "bg-amber text-cream border-amber"
          : "bg-transparent text-charcoal/75 border-charcoal/25 hover:border-charcoal/60 hover:text-charcoal",
      ].join(" ")}
    >
      {label}
      <span
        aria-hidden
        className={[
          "inline-flex items-center justify-center",
          "text-[10px] md:text-[11px] font-mono",
          isActive ? "text-cream/80" : "text-charcoal/45",
        ].join(" ")}
      >
        {count}
      </span>
    </button>
  );
}

// =============================================================================
// Commission row (executive — Section 84(2)(f))
// =============================================================================

interface CommissionRowProps {
  commission: CommissionSummary;
  index: number;
}

function CommissionRow({ commission, index }: CommissionRowProps) {
  const reduced = useReducedMotion() ?? false;
  const year = commissionEraYear(commission);
  const domain = domainChipClasses(commission.domain);
  const status = statusBadgeClasses(commission.status);
  const prosecution = prosecutionDescriptor(commission.produced_prosecutions);

  return (
    <motion.li
      initial={{ opacity: 0, y: reduced ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduced ? 0.001 : 0.35,
        delay: reduced ? 0 : Math.min(index * 0.04, 0.5),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="border-b border-charcoal/10 first:border-t-0"
    >
      <Link
        href={`/commissions/${commission.slug}`}
        className="group block py-5 md:py-7 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/40 rounded-lg -mx-2 px-2 transition-colors"
      >
        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3 md:mb-3">
          <span className="font-mono text-[11px] md:text-xs uppercase tracking-[0.2em] text-charcoal/55">
            {year}
          </span>
          <span
            className={[
              "inline-flex items-center px-2.5 py-0.5 rounded-full",
              "font-mono text-[10px] md:text-[11px] uppercase tracking-[0.14em]",
              "border",
              domain.bg,
              domain.text,
              domain.border,
            ].join(" ")}
          >
            {COMMISSION_DOMAIN_LABELS[commission.domain]}
          </span>
          <span
            className={[
              "inline-flex items-center gap-1.5 whitespace-nowrap",
              "px-2.5 py-0.5 rounded-full",
              "font-mono text-[10px] md:text-[11px] uppercase tracking-[0.14em]",
              "shadow-sm",
              status.bg,
              status.text,
            ].join(" ")}
          >
            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>

        <h3 className="font-serif text-[20px] md:text-2xl lg:text-[28px] leading-[1.2] text-charcoal group-hover:text-amber transition-colors max-w-4xl">
          {commission.popular_name}
        </h3>

        <p className="mt-2 font-sans text-[13px] md:text-sm text-charcoal/60 max-w-3xl">
          <span className="font-medium text-charcoal/80">Chair:</span>{" "}
          {commission.chair_name || "—"}
          {commission.president_who_established ? (
            <>
              {"  ·  "}
              <span className="font-medium text-charcoal/80">Established by:</span>{" "}
              {commission.president_who_established}
            </>
          ) : null}
        </p>

        <p className="mt-3 font-sans text-[14px] md:text-[15px] leading-relaxed text-charcoal/75 max-w-3xl line-clamp-2 md:line-clamp-2">
          {commission.reason_summary}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="inline-flex items-center gap-2 font-mono text-[11px] md:text-xs uppercase tracking-[0.14em]">
            <span
              aria-hidden
              className={`h-1.5 w-1.5 rounded-full ${prosecution.dotClass}`}
            />
            <span className={prosecution.textClass}>{prosecution.label}</span>
          </span>

          <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[11px] md:text-xs uppercase tracking-[0.18em] text-amber opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
            Full story
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </span>
        </div>
      </Link>
    </motion.li>
  );
}

// =============================================================================
// Committee row (legislative — NA Rule 253)
// =============================================================================

interface CommitteeRowProps {
  committee: AdhocCommitteeSummary;
  index: number;
}

function CommitteeRow({ committee, index }: CommitteeRowProps) {
  const reduced = useReducedMotion() ?? false;
  const year = adhocEraYear(committee);
  const domain = domainChipClasses(committee.domain);
  const category = adhocCategoryChipClasses(committee.category);
  const status = adhocStatusBadgeClasses(committee.status);
  const action = accountabilityActionDescriptor(committee);

  return (
    <motion.li
      initial={{ opacity: 0, y: reduced ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduced ? 0.001 : 0.35,
        delay: reduced ? 0 : Math.min(index * 0.04, 0.5),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="border-b border-charcoal/10 first:border-t-0"
    >
      <div className="relative -mx-2 px-2 py-5 md:py-7">
        <Link
          href={`/adhoc-committees/${committee.slug}`}
          className="absolute inset-0 z-0 rounded-lg ring-0 hover:bg-amber/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/40"
          aria-label={`Open ${committee.popular_name} on The Record`}
        />
        <article className="relative z-10 pointer-events-none">
        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3 md:mb-3">
          <span className="font-mono text-[11px] md:text-xs uppercase tracking-[0.2em] text-charcoal/55">
            {year}
          </span>
          <span
            className={[
              "inline-flex items-center px-2.5 py-0.5 rounded-full",
              "font-mono text-[10px] md:text-[11px] uppercase tracking-[0.14em]",
              "border",
              category.bg,
              category.text,
              category.border,
            ].join(" ")}
          >
            {ADHOC_CATEGORY_LABELS[committee.category]}
          </span>
          <span
            className={[
              "inline-flex items-center px-2.5 py-0.5 rounded-full",
              "font-mono text-[10px] md:text-[11px] uppercase tracking-[0.14em]",
              "border",
              domain.bg,
              domain.text,
              domain.border,
            ].join(" ")}
          >
            {COMMISSION_DOMAIN_LABELS[committee.domain]}
          </span>
          {committee.is_joint_committee ? (
            <span
              className={[
                "inline-flex items-center px-2 py-0.5 rounded-full",
                "font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em]",
                "bg-charcoal text-cream",
              ].join(" ")}
              title="Joint committee — both National Assembly and NCOP"
            >
              Joint
            </span>
          ) : null}
          <span
            className={[
              "inline-flex items-center gap-1.5 whitespace-nowrap",
              "px-2.5 py-0.5 rounded-full",
              "font-mono text-[10px] md:text-[11px] uppercase tracking-[0.14em]",
              "shadow-sm",
              status.bg,
              status.text,
            ].join(" ")}
          >
            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>

        <h3 className="font-serif text-[20px] md:text-2xl lg:text-[28px] leading-[1.2] text-charcoal max-w-4xl">
          {committee.popular_name}
        </h3>

        <p className="mt-2 font-sans text-[13px] md:text-sm text-charcoal/60 max-w-3xl">
          <span className="font-medium text-charcoal/80">Chair:</span>{" "}
          {committee.chair_name || "—"}
          {committee.parliament_term ? (
            <>
              {"  ·  "}
              <span className="font-medium text-charcoal/80">Parliament:</span>{" "}
              {committee.parliament_term}
              {committee.parliament_years ? ` (${committee.parliament_years})` : ""}
            </>
          ) : null}
        </p>

        <p className="mt-3 font-sans text-[14px] md:text-[15px] leading-relaxed text-charcoal/75 max-w-3xl line-clamp-2 md:line-clamp-2">
          {committee.mandate_summary}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="inline-flex items-center gap-2 font-mono text-[11px] md:text-xs uppercase tracking-[0.14em]">
            <span
              aria-hidden
              className={`h-1.5 w-1.5 rounded-full ${action.dotClass}`}
            />
            <span className={action.textClass}>{action.label}</span>
          </span>

          {committee.parliament_url ? (
            <a
              href={committee.parliament_url}
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto relative z-20 ml-auto inline-flex items-center gap-1.5 font-mono text-[11px] md:text-xs uppercase tracking-[0.18em] text-amber/80 hover:text-amber focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/40 rounded"
            >
              Parliament page
              <span aria-hidden>↗</span>
            </a>
          ) : (
            <span className="ml-auto font-mono text-[11px] text-charcoal/35">
              Full record →
            </span>
          )}
        </div>
        </article>
      </div>
    </motion.li>
  );
}

// =============================================================================
// Helpers (view-level)
// =============================================================================

function ResultsSummary({
  tab,
  count,
  total,
  activeDomain,
}: {
  tab: TabId;
  count: number;
  total: number;
  activeDomain: DomainFilter;
}) {
  const noun = tab === "commissions" ? "commissions" : "committees";

  if (activeDomain === "all") {
    return (
      <p className="py-6 md:py-8 font-mono text-[11px] md:text-xs uppercase tracking-[0.2em] text-charcoal/45">
        Showing all {total} {noun}
      </p>
    );
  }

  return (
    <p className="py-6 md:py-8 font-mono text-[11px] md:text-xs uppercase tracking-[0.2em] text-charcoal/45">
      Showing {count} of {total} {noun} — filter:{" "}
      <span className="text-amber">{COMMISSION_DOMAIN_LABELS[activeDomain]}</span>
    </p>
  );
}

function EmptyState({ bodyKind }: { bodyKind: "commissions" | "committees" }) {
  const noun = bodyKind === "commissions" ? "commissions" : "ad hoc committees";
  return (
    <div className="py-16 md:py-24 text-center">
      <p className="label-smallcaps text-charcoal/50 mb-2">No matches</p>
      <p className="font-serif text-xl md:text-2xl text-charcoal/75">
        No {noun} match this filter.
      </p>
    </div>
  );
}
