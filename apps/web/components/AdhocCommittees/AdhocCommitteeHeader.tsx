"use client";

/**
 * Header for /adhoc-committees/[slug] — breadcrumb, parliament + status
 * chips, optional joint-committee label, H1, full-name expand, meta row.
 */

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { AdhocCommitteeDetail } from "@the-record/shared-types";

import StatusBadge, {
  type StatusBadgeVariant,
} from "@/components/ui/StatusBadge";
import { ADHOC_STATUS_LABELS } from "@/lib/adhoc";
import { formatLongDate } from "@/lib/commissions";

function statusToVariant(status: AdhocCommitteeDetail["status"]): StatusBadgeVariant {
  switch (status) {
    case "active":
      return "active";
    case "lapsed":
      return "dormant";
    case "concluded":
    case "mandate_completed":
    default:
      return "resolved";
  }
}

interface AdhocCommitteeHeaderProps {
  committee: AdhocCommitteeDetail;
}

export default function AdhocCommitteeHeader({
  committee,
}: AdhocCommitteeHeaderProps) {
  return (
    <header className="flex flex-col gap-5 md:gap-6 pt-4 md:pt-6 pb-2">
      <Breadcrumb name={committee.popular_name} />

      <div className="flex flex-wrap items-center gap-2 md:gap-2.5">
        {committee.parliament_term ? (
          <span
            className={[
              "inline-flex items-center px-2.5 py-0.5 rounded-md",
              "font-mono text-[10px] md:text-[11px] uppercase tracking-[0.16em]",
              "bg-purple-500/10 text-purple-800 border border-purple-500/20",
            ].join(" ")}
          >
            {committee.parliament_term}
          </span>
        ) : null}

        <StatusBadge
          status={statusToVariant(committee.status)}
          label={ADHOC_STATUS_LABELS[committee.status]}
        />

        {committee.is_joint_committee ? (
          <span
            className={[
              "inline-flex items-center px-2.5 py-0.5 rounded-md",
              "font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em]",
              "bg-legal-blue/10 text-legal-blue border border-legal-blue/25",
            ].join(" ")}
            title="Joint committee — National Assembly and NCOP"
          >
            JOINT COMMITTEE
          </span>
        ) : null}
      </div>

      <div>
        <h1
          className="font-serif text-[30px] md:text-[40px] leading-[1.08] tracking-[-0.01em] text-charcoal max-w-4xl"
        >
          {committee.popular_name}
        </h1>

        <FullNameBlock fullName={committee.full_name} />
      </div>

      <p className="font-sans text-[13px] text-charcoal/55 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span>
          <span className="text-charcoal/45">Chair:</span>{" "}
          {committee.chair_name || "—"}
        </span>
        <span className="text-charcoal/30 hidden sm:inline" aria-hidden>
          ·
        </span>
        <span>
          <span className="text-charcoal/45">Est:</span>{" "}
          {formatLongDate(committee.announced_date)}
        </span>
        {committee.enabling_provision ? (
          <>
            <span className="text-charcoal/30 hidden sm:inline" aria-hidden>
              ·
            </span>
            <span className="min-w-0 sm:max-w-[min(100%,36rem)] text-charcoal/60">
              {committee.enabling_provision}
            </span>
          </>
        ) : null}
      </p>
    </header>
  );
}

function Breadcrumb({ name }: { name: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="font-sans text-[12px] leading-snug text-charcoal/50"
    >
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        <li>
          <Link
            href="/"
            className="hover:text-amber transition-colors focus:outline-none focus-visible:underline"
          >
            Home
          </Link>
        </li>
        <li aria-hidden className="text-charcoal/30 select-none">
          ›
        </li>
        <li>
          <Link
            href="/commissions"
            className="hover:text-amber transition-colors focus:outline-none focus-visible:underline"
          >
            Commissions
          </Link>
        </li>
        <li aria-hidden className="text-charcoal/30 select-none">
          ›
        </li>
        <li>
          <Link
            href="/commissions?tab=adhoc"
            className="hover:text-amber transition-colors focus:outline-none focus-visible:underline"
          >
            Ad Hoc committees
          </Link>
        </li>
        <li aria-hidden className="text-charcoal/30 select-none">
          ›
        </li>
        <li className="text-charcoal/70 min-w-0 line-clamp-2" aria-current="page">
          {name}
        </li>
      </ol>
    </nav>
  );
}

function FullNameBlock({ fullName }: { fullName: string }) {
  const [expanded, setExpanded] = useState(false);
  const clampRef = useRef<HTMLParagraphElement>(null);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    const el = clampRef.current;
    if (!el || expanded) {
      setTruncated(false);
      return;
    }
    const measure = () => {
      if (!clampRef.current) return;
      setTruncated(clampRef.current.scrollHeight > clampRef.current.clientHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fullName, expanded]);

  if (!fullName.trim()) return null;

  return (
    <div className="mt-3 max-w-4xl">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={expanded ? "open" : "closed"}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <p
            ref={clampRef}
            className={[
              "font-serif italic text-[15px] md:text-base leading-relaxed text-charcoal/70",
              expanded ? "" : "line-clamp-2",
            ].join(" ")}
          >
            {fullName}
          </p>
        </motion.div>
      </AnimatePresence>

      {!expanded && truncated ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-1.5 inline-flex font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-amber hover:underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/40 rounded"
        >
          Show full name
        </button>
      ) : null}

      {expanded && fullName.length > 80 ? (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mt-1.5 inline-flex font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-charcoal/50 hover:text-amber"
        >
          Show less
        </button>
      ) : null}
    </div>
  );
}
