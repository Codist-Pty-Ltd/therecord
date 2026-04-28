"use client";

/**
 * ProclamationsAndReferralChain — the interactive lower-fold of /siu.
 *
 * Two sections share a single piece of UI state, which is why they live
 * in one client component:
 *
 *   • REFERRAL CHAIN — an SVG that fans the headline PPE proclamation
 *     (R23/2020) into its three parallel referral tracks: NPA, government
 *     departments, and the Special Tribunal. Tapping a track filters the
 *     proclamations list below to those that have at least one referral
 *     of that kind.
 *
 *   • PROCLAMATIONS LIST — three status tabs (Active | Concluded |
 *     Litigation Ongoing) with editorial rows that show domain, status,
 *     signing details, and the four headline outcome chips
 *     (investigated / recovered / NPA referrals / tribunal cases).
 *
 * The combined component owns:
 *   - the active status tab
 *   - the active referral-track filter (set by the chain, applied to the
 *     list, displayed as a removable chip above the tabs)
 *
 * Mobile-first. SVG diagram switches from horizontal-fan (desktop) to
 * vertical-stack (mobile) via a `lg:` breakpoint swap rather than a
 * media-query measurement, so the layout is stable on first paint.
 */

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import type {
  CommissionDomain,
  SiuProclamationSummary,
} from "@the-record/shared-types";

import {
  COMMISSION_DOMAIN_LABELS,
  domainChipClasses,
  formatLongDate,
  formatRandsCompact,
} from "@/lib/commissions";
import {
  PROCLAMATION_TAB_LABELS,
  proclamationStatusBadgeClasses,
  tabForProclamationStatus,
  type ProclamationTab,
} from "@/lib/siu";

const EASE = [0.22, 1, 0.36, 1] as const;

// -----------------------------------------------------------------------------
// Track filter — the three parallel branches the SIU sends evidence down.
// `null` means "no filter applied".
// -----------------------------------------------------------------------------

type ReferralTrack = "npa" | "departments" | "tribunal";

const TRACK_LABELS: Record<ReferralTrack, string> = {
  npa: "NPA referrals",
  departments: "Disciplinary referrals",
  tribunal: "Tribunal cases",
};

interface ProclamationsAndReferralChainProps {
  proclamations: ReadonlyArray<SiuProclamationSummary>;
  /** Optional headline proclamation used by the referral diagram. Defaults to PPE R23/2020. */
  highlightProclamation?: SiuProclamationSummary;
}

export default function ProclamationsAndReferralChain({
  proclamations,
  highlightProclamation,
}: ProclamationsAndReferralChainProps) {
  // The PPE proclamation is the editorial example for the referral chain.
  // Fall back to whichever proclamation has the most NPA referrals so the
  // diagram is always populated even on subsets where R23/2020 is absent.
  const headline = useMemo<SiuProclamationSummary | null>(() => {
    if (highlightProclamation) return highlightProclamation;
    const ppe = proclamations.find(
      (p) => p.proclamation_number === "R23 of 2020",
    );
    if (ppe) return ppe;
    const sorted = [...proclamations].sort(
      (a, b) => (b.npa_referrals ?? 0) - (a.npa_referrals ?? 0),
    );
    return sorted[0] ?? null;
  }, [proclamations, highlightProclamation]);

  const [activeTrack, setActiveTrack] = useState<ReferralTrack | null>(null);
  const [activeTab, setActiveTab] = useState<ProclamationTab>("active");

  const listSectionRef = useRef<HTMLDivElement | null>(null);

  const handleTrackTap = (track: ReferralTrack) => {
    setActiveTrack((current) => (current === track ? null : track));
    requestAnimationFrame(() => {
      listSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  // -- derive grouped + filtered list ------------------------------------------
  const tabCounts = useMemo(() => {
    const counts: Record<ProclamationTab, number> = {
      active: 0,
      concluded: 0,
      litigation: 0,
    };
    for (const p of proclamations) {
      counts[tabForProclamationStatus(p.status)] += 1;
    }
    return counts;
  }, [proclamations]);

  const visibleProclamations = useMemo(() => {
    return proclamations
      .filter((p) => tabForProclamationStatus(p.status) === activeTab)
      .filter((p) => matchesTrackFilter(p, activeTrack))
      .sort((a, b) => {
        const da = a.signed_date ?? "";
        const db = b.signed_date ?? "";
        if (da !== db) return db.localeCompare(da);
        return a.proclamation_number.localeCompare(b.proclamation_number);
      });
  }, [proclamations, activeTab, activeTrack]);

  return (
    <>
      {headline ? (
        <ReferralChainSection
          proclamation={headline}
          activeTrack={activeTrack}
          onTrackTap={handleTrackTap}
        />
      ) : null}

      <section
        ref={listSectionRef}
        aria-labelledby="siu-proclamations-heading"
        className="bg-cream border-t border-charcoal/10"
      >
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-20">
          <p className="label-smallcaps text-amber mb-3">Proclamations</p>
          <h2
            id="siu-proclamations-heading"
            className="font-serif text-[28px] md:text-4xl lg:text-[44px] leading-[1.1] tracking-[-0.01em] text-charcoal"
          >
            Every investigation the President has ordered.
          </h2>
          <p className="mt-3 max-w-2xl font-sans text-[14px] md:text-base text-charcoal/65">
            Each proclamation activates the SIU on a specific matter. The
            money chips show what was investigated, recovered, and how many
            cases were referred onward.
          </p>

          <ActiveTrackChip
            track={activeTrack}
            onClear={() => setActiveTrack(null)}
          />

          <TabBar
            activeTab={activeTab}
            counts={tabCounts}
            onChange={setActiveTab}
          />

          <ResultsSummary
            count={visibleProclamations.length}
            total={tabCounts[activeTab]}
            track={activeTrack}
          />

          <AnimatePresence mode="wait">
            <motion.ul
              key={`${activeTab}:${activeTrack ?? "all"}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="flex flex-col"
            >
              {visibleProclamations.length === 0 ? (
                <EmptyState
                  tab={activeTab}
                  track={activeTrack}
                  onClearTrack={() => setActiveTrack(null)}
                />
              ) : (
                visibleProclamations.map((p, idx) => (
                  <ProclamationRow key={p.id} proclamation={p} index={idx} />
                ))
              )}
            </motion.ul>
          </AnimatePresence>
        </div>
      </section>
    </>
  );
}

function matchesTrackFilter(
  p: SiuProclamationSummary,
  track: ReferralTrack | null,
): boolean {
  if (!track) return true;
  switch (track) {
    case "npa":
      return (p.npa_referrals ?? 0) > 0;
    case "departments":
      return (p.department_referrals ?? 0) > 0;
    case "tribunal":
      return (p.tribunal_cases_filed ?? 0) > 0;
    default:
      return true;
  }
}

// =============================================================================
// Active-track filter chip — shown above the tabs while a track filter is on.
// =============================================================================

function ActiveTrackChip({
  track,
  onClear,
}: {
  track: ReferralTrack | null;
  onClear: () => void;
}) {
  if (!track) return null;
  return (
    <div className="mt-6 md:mt-8">
      <button
        type="button"
        onClick={onClear}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber text-cream font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] hover:bg-amber/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/60"
      >
        Filtered by {TRACK_LABELS[track]}
        <span aria-hidden className="text-cream/85 text-base leading-none">
          ×
        </span>
      </button>
    </div>
  );
}

// =============================================================================
// Tab bar — borrows the underline style from /commissions for visual continuity.
// =============================================================================

interface TabBarProps {
  activeTab: ProclamationTab;
  counts: Record<ProclamationTab, number>;
  onChange: (tab: ProclamationTab) => void;
}

function TabBar({ activeTab, counts, onChange }: TabBarProps) {
  const tabs: ReadonlyArray<ProclamationTab> = ["active", "concluded", "litigation"];
  return (
    <div
      role="tablist"
      aria-label="Proclamation status"
      className="mt-6 md:mt-8 flex items-end gap-5 md:gap-10 border-b border-charcoal/10 overflow-x-auto scrollbar-hidden"
    >
      {tabs.map((tab) => {
        const isActive = tab === activeTab;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab)}
            className={[
              "shrink-0 -mb-px pt-3 pb-3 md:pt-4 md:pb-4",
              "border-b-2 transition-colors duration-150",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/40 focus-visible:rounded",
              isActive
                ? "border-amber text-charcoal"
                : "border-transparent text-charcoal/55 hover:text-charcoal/85",
            ].join(" ")}
          >
            <span className="font-serif text-[16px] md:text-[19px] leading-none">
              {PROCLAMATION_TAB_LABELS[tab]}
            </span>
            <span
              aria-hidden
              className={[
                "ml-2 align-middle inline-flex items-center justify-center",
                "font-mono text-[10px] md:text-[11px]",
                isActive ? "text-amber" : "text-charcoal/40",
              ].join(" ")}
            >
              {counts[tab]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ResultsSummary({
  count,
  total,
  track,
}: {
  count: number;
  total: number;
  track: ReferralTrack | null;
}) {
  if (track) {
    return (
      <p className="py-5 md:py-7 font-mono text-[11px] md:text-xs uppercase tracking-[0.2em] text-charcoal/45">
        {count} of {total} proclamations match{" "}
        <span className="text-amber">{TRACK_LABELS[track]}</span>
      </p>
    );
  }
  return (
    <p className="py-5 md:py-7 font-mono text-[11px] md:text-xs uppercase tracking-[0.2em] text-charcoal/45">
      Showing {count} {count === 1 ? "proclamation" : "proclamations"}
    </p>
  );
}

function EmptyState({
  tab,
  track,
  onClearTrack,
}: {
  tab: ProclamationTab;
  track: ReferralTrack | null;
  onClearTrack: () => void;
}) {
  return (
    <li className="py-12 md:py-16 text-center">
      <p className="label-smallcaps text-charcoal/50 mb-2">No matches</p>
      <p className="font-serif text-xl md:text-2xl text-charcoal/75">
        {track
          ? `No ${PROCLAMATION_TAB_LABELS[tab].toLowerCase()} proclamations have ${TRACK_LABELS[track].toLowerCase()}.`
          : `No proclamations are currently ${PROCLAMATION_TAB_LABELS[tab].toLowerCase()}.`}
      </p>
      {track ? (
        <button
          type="button"
          onClick={onClearTrack}
          className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-amber hover:text-charcoal transition-colors"
        >
          Clear filter
          <span aria-hidden>×</span>
        </button>
      ) : null}
    </li>
  );
}

// =============================================================================
// Proclamation row — domain + status pills, title, signing context, then the
// four headline outcome chips. Mirrors the editorial layout from the brief.
// =============================================================================

function ProclamationRow({
  proclamation,
  index,
}: {
  proclamation: SiuProclamationSummary;
  index: number;
}) {
  const reduce = useReducedMotion() ?? false;
  const domainChip = domainChipClasses(proclamation.domain as CommissionDomain);
  const statusBadge = proclamationStatusBadgeClasses(proclamation.status);

  const investigated = formatRandsCompact(proclamation.investigated_rands);
  const recovered = formatRandsCompact(proclamation.recovered_rands);
  const npa = proclamation.npa_referrals ?? 0;
  const tribunal = proclamation.tribunal_cases_filed ?? 0;

  return (
    <motion.li
      initial={{ opacity: 0, y: reduce ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduce ? 0.001 : 0.35,
        delay: reduce ? 0 : Math.min(index * 0.04, 0.45),
        ease: EASE,
      }}
      className="border-b border-charcoal/10 first:border-t-0"
    >
      <article className="block py-5 md:py-7 -mx-2 px-2">
        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3">
          <span className="font-mono text-[11px] md:text-xs uppercase tracking-[0.2em] text-charcoal/55">
            {proclamation.proclamation_number}
          </span>
          <span
            className={[
              "inline-flex items-center px-2.5 py-0.5 rounded-full",
              "font-mono text-[10px] md:text-[11px] uppercase tracking-[0.14em]",
              "border",
              domainChip.bg,
              domainChip.text,
              domainChip.border,
            ].join(" ")}
          >
            {COMMISSION_DOMAIN_LABELS[proclamation.domain as CommissionDomain]}
          </span>
          <span
            className={[
              "inline-flex items-center gap-1.5 whitespace-nowrap",
              "px-2.5 py-0.5 rounded-full",
              "font-mono text-[10px] md:text-[11px] uppercase tracking-[0.14em]",
              "shadow-sm",
              statusBadge.bg,
              statusBadge.text,
            ].join(" ")}
          >
            <span
              aria-hidden
              className={`h-1.5 w-1.5 rounded-full ${statusBadge.dot}`}
            />
            {statusBadge.label}
          </span>
        </div>

        <h3 className="font-serif text-[18px] md:text-[24px] leading-[1.2] text-charcoal max-w-3xl">
          {proclamation.title}
        </h3>

        <p className="mt-2 font-sans text-[13px] md:text-sm text-charcoal/60 max-w-3xl">
          <span className="font-medium text-charcoal/80">Signed:</span>{" "}
          {formatLongDate(proclamation.signed_date)}
          {"  ·  "}
          <span className="font-medium text-charcoal/80">President:</span>{" "}
          {proclamation.president_who_signed}
        </p>

        <p className="mt-3 font-sans text-[14px] md:text-[15px] leading-relaxed text-charcoal/70 max-w-3xl line-clamp-2">
          {proclamation.plain_english_summary}
        </p>

        <div className="mt-4 pt-4 border-t border-charcoal/[0.07]">
          <dl className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
            <Metric label="Investigated" value={investigated} tone="charcoal" />
            <Metric
              label="Recovered"
              value={recovered}
              tone="amber"
              emphasis
            />
            <Metric
              label="NPA referrals"
              value={npa > 0 ? `${npa}` : "—"}
              tone="charcoal"
            />
            <Metric
              label="Tribunal cases"
              value={tribunal > 0 ? `${tribunal}` : "—"}
              tone="charcoal"
            />
          </dl>
        </div>

        <div className="mt-4 font-mono text-[11px] md:text-xs uppercase tracking-[0.18em] text-charcoal/35">
          <Link
            href={`/siu/proclamations/${proclamation.slug}`}
            className="inline-flex items-center gap-2 text-amber normal-case tracking-normal no-underline hover:underline"
          >
            <span>Full investigation</span>
            <span aria-hidden>→</span>
          </Link>
        </div>
      </article>
    </motion.li>
  );
}

interface MetricProps {
  label: string;
  value: string;
  tone: "amber" | "charcoal";
  emphasis?: boolean;
}

function Metric({ label, value, tone, emphasis }: MetricProps) {
  const valueClasses =
    tone === "amber"
      ? "text-amber"
      : value === "—"
        ? "text-charcoal/30"
        : "text-charcoal";
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-charcoal/55">
        {label}
      </dt>
      <dd
        className={[
          "font-serif leading-none",
          emphasis ? "text-[20px] md:text-[24px]" : "text-[16px] md:text-[19px]",
          valueClasses,
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}

// =============================================================================
// Referral Chain — single proclamation fans into three parallel tracks.
// Desktop: horizontal fan (single SVG with three diverging strokes). Mobile:
// vertical stack with a connecting trunk line down the left edge.
// =============================================================================

interface ReferralChainSectionProps {
  proclamation: SiuProclamationSummary;
  activeTrack: ReferralTrack | null;
  onTrackTap: (track: ReferralTrack) => void;
}

function ReferralChainSection({
  proclamation,
  activeTrack,
  onTrackTap,
}: ReferralChainSectionProps) {
  const reduce = useReducedMotion() ?? false;

  const tracks: ReadonlyArray<{
    id: ReferralTrack;
    target: string;
    line: string;
    metric: string;
    accent: "amber" | "blue" | "green";
  }> = useMemo(() => {
    const npa = proclamation.npa_referrals ?? 0;
    const departments = proclamation.department_referrals ?? 0;
    const tribunal = proclamation.tribunal_cases_filed ?? 0;
    const recovered = formatRandsCompact(proclamation.recovered_rands);
    const investigated = formatRandsCompact(proclamation.investigated_rands);
    return [
      {
        id: "npa",
        target: "National Prosecuting Authority",
        line: "Criminal evidence — for prosecution",
        metric: `${npa} ${npa === 1 ? "referral" : "referrals"}`,
        accent: "amber",
      },
      {
        id: "departments",
        target: "Government Departments",
        line: "Misconduct — for disciplinary action",
        metric:
          departments > 0
            ? `${departments} ${departments === 1 ? "referral" : "referrals"}`
            : "Reported in detail",
        accent: "blue",
      },
      {
        id: "tribunal",
        target: "Special Tribunal",
        line: "Contracts — to cancel and recover",
        metric:
          tribunal > 0
            ? `${tribunal} ${tribunal === 1 ? "case" : "cases"} · ${recovered === "—" ? investigated : recovered}`
            : "No tribunal cases filed yet",
        accent: "green",
      },
    ];
  }, [proclamation]);

  return (
    <section
      aria-labelledby="siu-referral-heading"
      className="bg-charcoal/[0.03] border-t border-charcoal/10"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <p className="label-smallcaps text-amber mb-3">Anatomy of a proclamation</p>
        <h2
          id="siu-referral-heading"
          className="font-serif text-[28px] md:text-4xl lg:text-[44px] leading-[1.1] tracking-[-0.01em] text-charcoal max-w-3xl"
        >
          One proclamation. Three parallel tracks.
        </h2>
        <p className="mt-3 max-w-2xl font-sans text-[14px] md:text-base text-charcoal/65">
          What the SIU finds in <span className="font-medium text-charcoal">{proclamation.title}</span>{" "}
          ({proclamation.proclamation_number}) flows simultaneously to the
          NPA, government departments, and the Special Tribunal. Tap a track
          to filter the list below.
        </p>

        <div className="mt-9 md:mt-14">
          {/* Mobile / tablet — vertical stack */}
          <div className="lg:hidden">
            <SourceCard proclamation={proclamation} />
            <div className="ml-6 md:ml-8 mt-4 border-l-2 border-amber/40 pl-6 md:pl-10 flex flex-col gap-4">
              {tracks.map((track, idx) => (
                <motion.button
                  key={track.id}
                  type="button"
                  onClick={() => onTrackTap(track.id)}
                  initial={{ opacity: 0, x: reduce ? 0 : -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: reduce ? 0 : 0.5,
                    delay: reduce ? 0 : idx * 0.1,
                    ease: EASE,
                  }}
                  className={trackButtonClasses(track.accent, activeTrack === track.id)}
                  aria-pressed={activeTrack === track.id}
                >
                  <TrackContent
                    target={track.target}
                    line={track.line}
                    metric={track.metric}
                    isActive={activeTrack === track.id}
                  />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Desktop — horizontal fan */}
          <div className="hidden lg:block">
            <DesktopFan
              proclamation={proclamation}
              tracks={tracks}
              activeTrack={activeTrack}
              onTrackTap={onTrackTap}
              reduce={reduce}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function SourceCard({ proclamation }: { proclamation: SiuProclamationSummary }) {
  return (
    <div className="inline-flex items-center gap-3 max-w-full">
      <span
        aria-hidden
        className="inline-flex items-center justify-center shrink-0 w-12 h-12 rounded-full bg-amber text-cream font-serif text-[18px] leading-none shadow-[0_4px_14px_rgba(200,101,27,0.35)]"
      >
        ⚖
      </span>
      <div className="min-w-0">
        <p className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-amber">
          Proclamation
        </p>
        <p className="font-serif text-[18px] md:text-[22px] leading-[1.15] text-charcoal truncate">
          {proclamation.proclamation_number}
        </p>
      </div>
    </div>
  );
}

function trackButtonClasses(
  accent: "amber" | "blue" | "green",
  isActive: boolean,
): string {
  const accentBorder = {
    amber: isActive ? "border-amber" : "border-amber/40 hover:border-amber",
    blue: isActive ? "border-legal-blue" : "border-legal-blue/40 hover:border-legal-blue",
    green: isActive
      ? "border-timeline-green"
      : "border-timeline-green/40 hover:border-timeline-green",
  }[accent];
  const accentBg = isActive
    ? {
        amber: "bg-amber/[0.08]",
        blue: "bg-legal-blue/[0.06]",
        green: "bg-timeline-green/[0.06]",
      }[accent]
    : "bg-white";
  return [
    "block w-full text-left",
    "rounded-xl border-2 p-4 md:p-5",
    "transition-colors duration-200",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/40",
    accentBorder,
    accentBg,
  ].join(" ");
}

function TrackContent({
  target,
  line,
  metric,
  isActive,
}: {
  target: string;
  line: string;
  metric: string;
  isActive: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-charcoal/50">
        {line}
      </p>
      <p className="font-serif text-[18px] md:text-[22px] leading-[1.2] text-charcoal">
        {target}
      </p>
      <p className="font-sans text-[13px] md:text-sm text-charcoal/70">
        {metric}
      </p>
      <p
        className={[
          "mt-1 inline-flex items-center gap-1.5 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em]",
          isActive ? "text-amber" : "text-charcoal/40",
        ].join(" ")}
      >
        {isActive ? "Filter active" : "Tap to filter list"}
        <span aria-hidden>{isActive ? "✓" : "→"}</span>
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Desktop fan — single SVG holds the three diverging strokes plus the source
// pill on the left and three target cards on the right.
// -----------------------------------------------------------------------------

interface DesktopFanProps {
  proclamation: SiuProclamationSummary;
  tracks: ReadonlyArray<{
    id: ReferralTrack;
    target: string;
    line: string;
    metric: string;
    accent: "amber" | "blue" | "green";
  }>;
  activeTrack: ReferralTrack | null;
  onTrackTap: (track: ReferralTrack) => void;
  reduce: boolean;
}

const STROKE_FOR_ACCENT: Record<"amber" | "blue" | "green", string> = {
  amber: "var(--accent-amber)",
  blue: "var(--accent-blue)",
  green: "var(--accent-green)",
};

function DesktopFan({
  proclamation,
  tracks,
  activeTrack,
  onTrackTap,
  reduce,
}: DesktopFanProps) {
  const drawVariants: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
    },
  };

  return (
    <div
      className="relative grid grid-cols-12 gap-6 items-center"
      style={
        {
          ["--accent-amber"]: "#C8651B",
          ["--accent-blue"]: "#3B5EA6",
          ["--accent-green"]: "#16A34A",
        } as React.CSSProperties
      }
    >
      {/* SVG layer — drawn behind the cards using absolute positioning */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 1000 320"
      >
        {[
          { d: "M180 160 C 360 160, 480 60, 720 60", accent: "amber" as const },
          { d: "M180 160 L 720 160", accent: "blue" as const },
          { d: "M180 160 C 360 160, 480 260, 720 260", accent: "green" as const },
        ].map((path, idx) => {
          const accent = path.accent;
          const isActive = activeTrack === tracks[idx]?.id;
          return (
            <motion.path
              key={accent}
              d={path.d}
              fill="none"
              stroke={STROKE_FOR_ACCENT[accent]}
              strokeWidth={isActive ? 2.5 : 1.5}
              strokeOpacity={isActive ? 0.95 : activeTrack ? 0.25 : 0.7}
              strokeLinecap="round"
              strokeDasharray="4 6"
              variants={drawVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: reduce ? 0 : 1.0,
                delay: reduce ? 0 : 0.2 + idx * 0.18,
                ease: EASE,
              }}
            />
          );
        })}
      </svg>

      {/* Source pill — col 1-4 */}
      <div className="col-span-4 relative z-10">
        <div className="inline-flex flex-col gap-3 bg-charcoal text-cream rounded-2xl p-6 shadow-[0_10px_30px_rgba(28,28,30,0.18)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber">
            Proclamation
          </p>
          <p className="font-serif text-[28px] leading-[1.05] text-cream">
            {proclamation.proclamation_number}
          </p>
          <p className="font-sans text-[13px] leading-relaxed text-cream/75 max-w-[18rem]">
            {proclamation.title}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/55">
            {formatRandsCompact(proclamation.investigated_rands)}{" investigated"}
          </p>
        </div>
      </div>

      {/* Target cards — col 8-12 */}
      <div className="col-span-8 col-start-5 relative z-10 flex flex-col gap-3">
        {tracks.map((track, idx) => (
          <motion.button
            key={track.id}
            type="button"
            onClick={() => onTrackTap(track.id)}
            initial={{ opacity: 0, x: reduce ? 0 : 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{
              duration: reduce ? 0 : 0.5,
              delay: reduce ? 0 : 0.5 + idx * 0.15,
              ease: EASE,
            }}
            className={trackButtonClasses(track.accent, activeTrack === track.id)}
            aria-pressed={activeTrack === track.id}
            style={{ marginLeft: idx === 1 ? "0" : "auto", maxWidth: "30rem" }}
          >
            <TrackContent
              target={track.target}
              line={track.line}
              metric={track.metric}
              isActive={activeTrack === track.id}
            />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
