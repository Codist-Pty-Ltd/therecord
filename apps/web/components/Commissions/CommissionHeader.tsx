"use client";

/**
 * CommissionHeader — top band of /commissions/[slug].
 *
 * Displays:
 *   • Domain + status + "established by" context in small-caps metadata.
 *   • H1: popular_name (Instrument Serif, 32px mobile).
 *   • full_name in italic directly beneath — commission full names run 600+
 *     characters ("Judicial Commission of Inquiry into…"), so we truncate
 *     with a client-side expand toggle.
 *   • Chair / Announced / Concluded / Total days meta row.
 *
 * Client Component (useState for expand toggle; Framer for the crossfade).
 */

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import type { CommissionDetail } from "@the-record/shared-types";

import StaleBadge from "@/components/ui/StaleBadge";
import {
  COMMISSION_DOMAIN_LABELS,
  domainChipClasses,
  formatLongDate,
  statusBadgeClasses,
} from "@/lib/commissions";

interface CommissionHeaderProps {
  commission: CommissionDetail;
}

const FULL_NAME_TRUNCATE_CHARS = 140;

export default function CommissionHeader({ commission }: CommissionHeaderProps) {
  const [expanded, setExpanded] = useState(false);

  const domain = domainChipClasses(commission.domain);
  const status = statusBadgeClasses(commission.status);
  const needsTruncate = commission.full_name.length > FULL_NAME_TRUNCATE_CHARS;
  const shown =
    expanded || !needsTruncate
      ? commission.full_name
      : commission.full_name.slice(0, FULL_NAME_TRUNCATE_CHARS).trimEnd() + "…";

  return (
    <header className="flex flex-col gap-5 md:gap-7 py-6 md:py-10 lg:py-12">
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
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
          aria-label={`Status: ${status.label}`}
          className={[
            "inline-flex items-center gap-1.5 whitespace-nowrap",
            "px-2.5 py-0.5 rounded-full",
            "font-mono text-[10px] md:text-[11px] uppercase tracking-[0.14em]",
            "shadow-sm",
            status.bg,
            status.text,
          ].join(" ")}
        >
          <span
            aria-hidden
            className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
          />
          <span aria-hidden>{status.label}</span>
        </span>

        <StaleBadge
          lastUpdatedAt={commission.updated_at}
          staleThresholdHours={7 * 24}
          tooltip="This commission dossier has not been updated recently. Information may be incomplete."
        />

        {commission.president_who_established ? (
          <span className="label-smallcaps text-charcoal/55">
            Established by {commission.president_who_established}
          </span>
        ) : null}
      </div>

      <div>
        <h1 className="font-serif text-[32px] md:text-5xl lg:text-[56px] leading-[1.05] tracking-[-0.01em] text-charcoal max-w-4xl">
          {commission.popular_name}
        </h1>

        <AnimatePresence initial={false} mode="wait">
          <motion.p
            key={expanded ? "expanded" : "truncated"}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mt-3 md:mt-4 font-serif italic text-[15px] md:text-base lg:text-[17px] leading-relaxed text-charcoal/70 max-w-4xl"
          >
            {shown}
          </motion.p>
        </AnimatePresence>

        {needsTruncate ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-amber hover:underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/40 rounded"
          >
            {expanded ? "Collapse full name" : "Read full name"}
            <span aria-hidden>{expanded ? "↑" : "↓"}</span>
          </button>
        ) : null}
      </div>

      <MetaRow commission={commission} />
    </header>
  );
}

// =============================================================================
// Meta row
// =============================================================================

function MetaRow({ commission }: { commission: CommissionDetail }) {
  const cells: Array<{ label: string; value: string }> = [
    { label: "Chair", value: commission.chair_name || "—" },
    { label: "Announced", value: formatLongDate(commission.announced_date) },
  ];

  if (commission.status === "active" || commission.status === "pending_report") {
    cells.push({
      label: "Hearings started",
      value: formatLongDate(commission.hearings_started),
    });
  } else {
    cells.push({
      label: "Concluded",
      value: formatLongDate(commission.concluded_date),
    });
  }

  if (commission.total_hearing_days != null) {
    cells.push({
      label: "Hearing days",
      value: String(commission.total_hearing_days),
    });
  }

  return (
    <dl className="border-t border-charcoal/10 pt-5 md:pt-6 flex flex-wrap gap-x-8 gap-y-4">
      {cells.map((cell) => (
        <div key={cell.label} className="flex flex-col gap-0.5 min-w-[120px]">
          <dt className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-charcoal/50">
            {cell.label}
          </dt>
          <dd className="font-serif text-[16px] md:text-lg leading-snug text-charcoal">
            {cell.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
