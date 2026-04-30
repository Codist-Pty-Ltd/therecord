/**
 * Home explorer row lists — commissions, ad hoc committees, SIU proclamations.
 * Shared with /domain/[name] for consistent accountability UI.
 */

import Link from "next/link";

import {
  ADHOC_CATEGORY_LABELS,
  adhocEraYear,
  adhocStatusBadgeClasses,
} from "@/lib/adhoc";
import {
  bodyStatusChipClasses,
  convictionRateDisplay,
  formatBodyYearsActive,
} from "@/lib/accountability-bodies-display";
import {
  COMMISSION_DOMAIN_LABELS,
  statusBadgeClasses,
} from "@/lib/commissions";
import { formatRands } from "@/lib/format";
import { proclamationStatusBadgeClasses } from "@/lib/siu";

import type {
  AccountabilityBody,
  AdhocCommitteeSummary,
  CommissionSummary,
  SiuProclamationSummary,
} from "@the-record/shared-types";

// -----------------------------------------------------------------------------
// Commissions
// -----------------------------------------------------------------------------

function commissionYear(c: CommissionSummary): string {
  const d = c.announced_date ?? c.hearings_started ?? c.concluded_date;
  if (!d) return "—";
  return d.slice(0, 4);
}

function prosecutionsBadge(p: boolean | null) {
  if (p === true) {
    return (
      <span className="inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider bg-timeline-green/12 text-timeline-green">
        Prosecutions
      </span>
    );
  }
  if (p === false) {
    return (
      <span className="inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider bg-charge-red/10 text-charge-red">
        No prosecutions
      </span>
    );
  }
  return null;
}

export function CommissionsRowList({ rows }: { rows: CommissionSummary[] }) {
  if (rows.length === 0) {
    return <ListEmptyHint />;
  }
  return (
    <ul className="divide-y divide-charcoal/10">
      {rows.map((c) => {
        const st = statusBadgeClasses(c.status);
        return (
          <li key={c.id}>
            <Link
              href={`/commissions/${c.slug}`}
              className="group flex min-h-[48px] items-start justify-between gap-3 py-3 transition hover:bg-amber/[0.04] first:pt-0"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="w-9 shrink-0 font-mono text-[11px] text-charcoal/45">
                    {commissionYear(c)}
                  </span>
                  <h3 className="font-serif text-base text-charcoal">
                    {c.popular_name}
                  </h3>
                </div>
                <p className="mt-0.5 pl-11 text-xs text-charcoal/55">
                  {c.chair_name ? `${c.chair_name} · ` : null}
                  {COMMISSION_DOMAIN_LABELS[c.domain]}
                </p>
                <div className="mt-2 pl-11 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider ${st.bg} ${st.text}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                    {st.label}
                  </span>
                  {prosecutionsBadge(c.produced_prosecutions)}
                </div>
              </div>
              <span className="shrink-0 text-charcoal/35 transition group-hover:text-amber">
                →
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// -----------------------------------------------------------------------------
// Ad hoc committees
// -----------------------------------------------------------------------------

function accountabilityActionBadge(v: boolean | null) {
  if (v === true) {
    return (
      <span className="inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider bg-timeline-green/12 text-timeline-green">
        Action
      </span>
    );
  }
  if (v === false) {
    return (
      <span className="inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider bg-charge-red/10 text-charge-red">
        None
      </span>
    );
  }
  return null;
}

export function AdhocRowList({ rows }: { rows: AdhocCommitteeSummary[] }) {
  if (rows.length === 0) {
    return <ListEmptyHint />;
  }
  return (
    <ul className="divide-y divide-charcoal/10">
      {rows.map((c) => {
        const y = adhocEraYear(c);
        const st = adhocStatusBadgeClasses(c.status);
        return (
          <li key={c.id}>
            <Link
              href={`/adhoc-committees/${c.slug}`}
              className="group flex min-h-[48px] items-start justify-between gap-3 py-3 transition hover:bg-amber/[0.04] first:pt-0"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="w-9 shrink-0 font-mono text-[11px] text-charcoal/45">
                    {y || "—"}
                  </span>
                  <h3 className="font-serif text-base text-charcoal">
                    {c.popular_name}
                  </h3>
                </div>
                <p className="mt-0.5 pl-11 text-xs text-charcoal/55">
                  {c.chair_name ? `${c.chair_name} · ` : null}
                  {ADHOC_CATEGORY_LABELS[c.category]}
                </p>
                <div className="mt-2 pl-11 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider ${st.bg} ${st.text}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                    {st.label}
                  </span>
                  {accountabilityActionBadge(c.produced_accountability_action)}
                </div>
              </div>
              <span className="shrink-0 text-charcoal/35 transition group-hover:text-amber">
                →
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// -----------------------------------------------------------------------------
// Accountability bodies (special units)
// -----------------------------------------------------------------------------

export function BodiesRowList({ rows }: { rows: AccountabilityBody[] }) {
  if (rows.length === 0) {
    return <ListEmptyHint />;
  }
  return (
    <ul className="divide-y divide-charcoal/10">
      {rows.map((b) => {
        const st = bodyStatusChipClasses(b.status);
        const rate = convictionRateDisplay(b.conviction_rate_percentage);
        const years = formatBodyYearsActive(b);
        return (
          <li key={b.id}>
            <Link
              href={`/accountability-bodies/${b.slug}`}
              className="group flex min-h-[48px] items-start justify-between gap-3 py-3 transition hover:bg-amber/[0.04] first:pt-0"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h3 className="font-serif text-base text-charcoal">{b.popular_name}</h3>
                  <span className="rounded border border-amber/35 bg-amber/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-amber">
                    {b.abbreviation}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider ${st.wrap}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                    {st.label}
                  </span>
                  {rate ? (
                    <span className="font-mono text-[10px] text-amber">
                      Conviction {rate}
                    </span>
                  ) : null}
                  <span className="font-mono text-[10px] text-charcoal/45">{years}</span>
                </div>
              </div>
              <span className="shrink-0 text-charcoal/35 transition group-hover:text-amber">
                →
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// -----------------------------------------------------------------------------
// SIU
// -----------------------------------------------------------------------------

export function SiuProclamationsRowList({ rows }: { rows: SiuProclamationSummary[] }) {
  if (rows.length === 0) {
    return <ListEmptyHint />;
  }
  return (
    <ul className="divide-y divide-charcoal/10">
      {rows.map((p) => {
        const st = proclamationStatusBadgeClasses(p.status);
        const rec = p.recovered_rands
          ? formatRands(p.recovered_rands)
          : null;
        return (
          <li key={p.id}>
            <Link
              href={`/siu/proclamations/${p.slug}`}
              className="flex min-h-[48px] items-start justify-between gap-3 py-3 transition hover:bg-amber/[0.04] first:pt-0"
            >
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] text-charge-red">
                  {p.proclamation_number}
                </p>
                <h3 className="mt-0.5 font-serif text-base text-charcoal line-clamp-2">
                  {p.title}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-charcoal/60">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider ${st.bg} ${st.text}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${st.dot}`}
                      aria-hidden
                    />
                    {st.label}
                  </span>
                  {rec && rec !== "N/A" ? <span>Recovered {rec}</span> : null}
                </div>
              </div>
              <span className="shrink-0 text-charcoal/35">→</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// -----------------------------------------------------------------------------

function ListEmptyHint() {
  return (
    <p className="text-sm text-charcoal/55 py-6">No records in this list yet.</p>
  );
}
