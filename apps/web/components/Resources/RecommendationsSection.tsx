"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";

import type {
  CommissionRecommendationBundle,
  ImplementationStatus,
  Recommendation,
  RecommendationCategory,
  RecommendationStatusCounts,
} from "@the-record/shared-types";

const DISPLAY_CATEGORY_ORDER: RecommendationCategory[] = [
  "prosecution",
  "legislation",
  "policy",
  "institutional",
  "disciplinary",
  "further_investigation",
  "compensation",
  "appointment",
  "other",
];

const EMPTY_COUNTS: RecommendationStatusCounts = {
  implemented: 0,
  partially_implemented: 0,
  not_implemented: 0,
  in_progress: 0,
  rejected: 0,
  unknown: 0,
};

function emptyByCategory(): CommissionRecommendationBundle["by_category"] {
  return {
    prosecution: [],
    legislation: [],
    policy: [],
    institutional: [],
    disciplinary: [],
    further_investigation: [],
    compensation: [],
    appointment: [],
    other: [],
  };
}

function flattenRecommendations(
  byCategory: CommissionRecommendationBundle["by_category"],
): Recommendation[] {
  return DISPLAY_CATEGORY_ORDER.flatMap((k) => byCategory[k] ?? []);
}

type ChipFilter =
  | "all"
  | "prosecution"
  | "legislation"
  | "institutional"
  | "compensation"
  | "other";

function categoryMatchesChip(
  category: RecommendationCategory,
  chip: ChipFilter,
): boolean {
  if (chip === "all") return true;
  if (chip === "other") {
    return (
      category === "other" ||
      category === "policy" ||
      category === "disciplinary" ||
      category === "further_investigation" ||
      category === "appointment"
    );
  }
  return category === chip;
}

function CategoryIcon({ category }: { category: RecommendationCategory }) {
  const map: Record<RecommendationCategory, { emoji: string; className: string }> =
    {
      prosecution: { emoji: "⚖️", className: "text-legal-blue" },
      legislation: { emoji: "📋", className: "text-amber" },
      institutional: { emoji: "🏛️", className: "text-charcoal" },
      compensation: { emoji: "💛", className: "text-constitutional-gold" },
      appointment: { emoji: "👤", className: "text-teal-600" },
      policy: { emoji: "📎", className: "text-charcoal/70" },
      disciplinary: { emoji: "⚠️", className: "text-charcoal/70" },
      further_investigation: { emoji: "🔎", className: "text-charcoal/70" },
      other: { emoji: "•", className: "text-charcoal/50" },
    };
  const row = map[category];
  return (
    <span
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border border-charcoal/10 bg-cream text-base ${row.className}`}
      aria-hidden
    >
      {row.emoji}
    </span>
  );
}

function StatusIndicator({ status }: { status: ImplementationStatus }) {
  const config: Record<
    ImplementationStatus,
    { dot: string; label: string; pulse?: boolean }
  > = {
    implemented: {
      dot: "bg-timeline-green",
      label: "Implemented",
    },
    partially_implemented: {
      dot: "bg-amber",
      label: "Partial",
    },
    not_implemented: {
      dot: "bg-charge-red",
      label: "Not implemented",
    },
    in_progress: {
      dot: "bg-amber",
      label: "In progress",
      pulse: true,
    },
    rejected: {
      dot: "bg-charge-red",
      label: "× Rejected",
    },
    unknown: {
      dot: "bg-charcoal/30",
      label: "Unknown",
    },
  };
  const c = config[status];
  return (
    <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
      <div className="flex items-center gap-1.5">
        <span
          className={`h-2 w-2 rounded-full ${c.dot} ${c.pulse ? "animate-pulse" : ""}`}
          aria-hidden
        />
        <span className="font-mono text-[10px] uppercase tracking-wide text-charcoal/70">
          {c.label}
        </span>
      </div>
    </div>
  );
}

function ImplementationBar({ counts }: { counts: RecommendationStatusCounts }) {
  const total =
    counts.implemented +
    counts.partially_implemented +
    counts.not_implemented +
    counts.in_progress +
    counts.rejected +
    counts.unknown;

  if (total === 0) {
    return (
      <div
        className="h-2 w-full max-w-xs rounded-full bg-charcoal/10"
        aria-hidden
      />
    );
  }

  const pct = (n: number) => (n / total) * 100;
  const green = pct(counts.implemented);
  const amber = pct(counts.partially_implemented + counts.in_progress);
  const red = pct(counts.not_implemented + counts.rejected);
  const gray = pct(counts.unknown);

  return (
    <div
      className="flex h-2 w-full max-w-xs overflow-hidden rounded-full bg-charcoal/10"
      role="img"
      aria-label="Implementation mix: green implemented, amber partial or in progress, red not implemented or rejected, gray unknown"
    >
      {green > 0 ? (
        <span
          className="h-full bg-timeline-green"
          style={{ width: `${green}%` }}
        />
      ) : null}
      {amber > 0 ? (
        <span className="h-full bg-amber" style={{ width: `${amber}%` }} />
      ) : null}
      {red > 0 ? (
        <span className="h-full bg-charge-red" style={{ width: `${red}%` }} />
      ) : null}
      {gray > 0 ? (
        <span className="h-full bg-charcoal/35" style={{ width: `${gray}%` }} />
      ) : null}
    </div>
  );
}

const CHIPS: { id: ChipFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "prosecution", label: "Prosecution" },
  { id: "legislation", label: "Legislation" },
  { id: "institutional", label: "Institutional" },
  { id: "compensation", label: "Compensation" },
  { id: "other", label: "Other" },
];

function RecommendationRow({
  rec,
  expanded,
  onToggle,
}: {
  rec: Recommendation;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasExpandable =
    Boolean(rec.plain_english?.trim()) ||
    Boolean(rec.plain_english_child?.trim()) ||
    Boolean(rec.full_text?.trim()) ||
    Boolean(rec.implementation_notes?.trim()) ||
    Boolean(rec.implementation_source_url?.trim());

  return (
    <li className="border-b border-charcoal/10 last:border-b-0">
      <div
        className="flex cursor-pointer gap-3 py-4 md:gap-4 md:py-5"
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
      >
        <CategoryIcon category={rec.category} />
        <div className="min-w-0 flex-1">
          {rec.reference_number ? (
            <p className="font-mono text-[10px] text-charcoal/45">
              {rec.reference_number}
            </p>
          ) : null}
          <p className="font-sans text-sm font-medium leading-snug text-charcoal md:text-[14px]">
            {rec.title}
          </p>
          {rec.directed_at ? (
            <p className="mt-1 font-mono text-[11px] text-charcoal/50">
              → {rec.directed_at}
            </p>
          ) : null}
          {rec.plain_english?.trim() ? (
            <p className="mt-2 line-clamp-2 font-sans text-[13px] leading-relaxed text-charcoal/65">
              {rec.plain_english.trim()}
            </p>
          ) : null}
        </div>
        <StatusIndicator status={rec.implementation_status} />
      </div>
      <AnimatePresence initial={false}>
        {expanded && hasExpandable ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-charcoal/5 pb-4 pl-11 pr-2 pt-2 md:pl-[3.25rem]">
              {rec.plain_english?.trim() ? (
                <p className="font-sans text-sm leading-relaxed text-charcoal/75">
                  {rec.plain_english.trim()}
                </p>
              ) : null}
              {rec.plain_english_child?.trim() ? (
                <p className="font-sans text-sm leading-relaxed text-charcoal/65">
                  <span className="font-medium text-charcoal/80">For younger readers: </span>
                  {rec.plain_english_child.trim()}
                </p>
              ) : null}
              {rec.full_text?.trim() ? (
                <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-charcoal/80">
                  {rec.full_text.trim()}
                </p>
              ) : null}
              {rec.implementation_notes?.trim() ? (
                <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-charcoal/75">
                  <span className="font-medium text-charcoal">Status notes: </span>
                  {rec.implementation_notes.trim()}
                </p>
              ) : null}
              {rec.implementation_source_url ? (
                <a
                  href={rec.implementation_source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block font-mono text-xs text-amber underline-offset-2 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Source link →
                </a>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}

export interface RecommendationsSectionProps {
  /** From `GET /api/commissions/:slug` — `recommendations_summary`. */
  summary: CommissionRecommendationBundle | undefined;
  commissionName: string;
}

export default function RecommendationsSection({
  summary,
  commissionName,
}: RecommendationsSectionProps) {
  const bundle = summary ?? {
    by_category: emptyByCategory(),
    status_counts: { ...EMPTY_COUNTS },
  };

  const allFlat = useMemo(
    () => flattenRecommendations(bundle.by_category),
    [bundle.by_category],
  );

  const [chip, setChip] = useState<ChipFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(
    () => allFlat.filter((r) => categoryMatchesChip(r.category, chip)),
    [allFlat, chip],
  );

  const { status_counts: sc } = bundle;
  const total =
    sc.implemented +
    sc.partially_implemented +
    sc.not_implemented +
    sc.in_progress +
    sc.rejected +
    sc.unknown;

  const implementedPct =
    total === 0 ? 0 : Math.round((sc.implemented / total) * 1000) / 10;

  if (total === 0) {
    return (
      <section
        aria-label="Recommendations"
        className="w-full max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10 border-t border-charcoal/10"
      >
        <h2 className="font-serif text-lg text-charcoal md:text-xl">
          Recommendations
        </h2>
        <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-charcoal/60">
          No formal recommendations have been captured for {commissionName} yet.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Recommendations"
      className="w-full max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 border-t border-charcoal/10"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8">
        <h2 className="font-serif text-lg text-charcoal md:text-xl shrink-0">
          Recommendations
        </h2>
        <div className="flex flex-col items-stretch gap-2 md:items-end md:text-right">
          <p className="font-mono text-[11px] text-charcoal/55">
            <span className="text-charcoal">{total}</span> total ·{" "}
            <span className="text-timeline-green">{implementedPct}%</span>{" "}
            implemented ·{" "}
            <span className="text-charge-red">{sc.not_implemented + sc.rejected}</span>{" "}
            not implemented
          </p>
          <ImplementationBar counts={sc} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Filter by category">
        {CHIPS.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={chip === c.id}
            onClick={() => setChip(c.id)}
            className={
              chip === c.id
                ? "rounded-full border border-amber/50 bg-amber/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide text-charcoal"
                : "rounded-full border border-charcoal/10 bg-cream px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide text-charcoal/60 hover:border-charcoal/25"
            }
          >
            {c.label}
          </button>
        ))}
      </div>

      <ul className="mt-2 divide-y divide-charcoal/5 rounded border border-charcoal/10 bg-cream/50 md:mt-4">
        {filtered.map((rec) => (
          <RecommendationRow
            key={rec.id}
            rec={rec}
            expanded={expandedId === rec.id}
            onToggle={() =>
              setExpandedId((id) => (id === rec.id ? null : rec.id))
            }
          />
        ))}
      </ul>

      {filtered.length === 0 ? (
        <p className="mt-4 font-sans text-sm text-charcoal/55">
          No recommendations in this category.
        </p>
      ) : null}

      {/* Named persons — show for visible list items that have names */}
      {filtered.some((r) => r.persons_named && r.persons_named.length > 0) ? (
        <div className="mt-8 border-t border-charcoal/10 pt-6">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-charcoal/50 mb-3">
            Named in recommendations (this list)
          </h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(
              new Set(
                filtered.flatMap((r) => r.persons_named ?? []),
              ),
            ).map((name) => (
              <Link
                key={name}
                href={`/people?search=${encodeURIComponent(name)}`}
                className="rounded-full border border-charcoal/15 bg-cream px-2.5 py-1 font-mono text-[10px] text-charcoal/75 hover:border-amber/40 hover:text-amber"
              >
                {name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
