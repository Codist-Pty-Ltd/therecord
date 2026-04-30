"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { formatRands } from "@/lib/format";
import type { AccountabilityBody, AccountabilityBodyCase, CaseOutcome } from "@the-record/shared-types";

type CaseFilter = "all" | "convicted" | "transferred" | "withdrawn";

function outcomeBadge(outcome: CaseOutcome): { label: string; className: string } {
  switch (outcome) {
    case "convicted":
      return {
        label: "Convicted",
        className: "bg-timeline-green/12 text-timeline-green",
      };
    case "transferred_to_hawks":
    case "transferred_to_npa":
      return {
        label:
          outcome === "transferred_to_hawks"
            ? "Transferred to Hawks"
            : "Transferred to NPA",
        className: "bg-amber/15 text-amber",
      };
    case "plea_deal":
      return {
        label: "Plea deal",
        className: "bg-legal-blue/12 text-legal-blue",
      };
    case "never_charged":
      return {
        label: "Never charged",
        className: "bg-charge-red/12 text-charge-red",
      };
    case "charges_withdrawn":
      return {
        label: "Withdrawn",
        className: "bg-charcoal/10 text-charcoal/75",
      };
    default:
      return {
        label: outcome.replace(/_/g, " "),
        className: "bg-charcoal/8 text-charcoal/70",
      };
  }
}

function matchesFilter(c: AccountabilityBodyCase, f: CaseFilter): boolean {
  if (f === "all") return true;
  if (f === "convicted") return c.outcome === "convicted";
  if (f === "transferred")
    return c.outcome === "transferred_to_hawks" || c.outcome === "transferred_to_npa";
  if (f === "withdrawn") return c.outcome === "charges_withdrawn";
  return true;
}

const FILTER_CHIPS: { id: CaseFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "convicted", label: "Convicted" },
  { id: "transferred", label: "Transferred" },
  { id: "withdrawn", label: "Withdrawn" },
];

interface HighProfileCasesSectionProps {
  body: AccountabilityBody;
  cases: AccountabilityBodyCase[];
  /** Resolve story slug for “Full story” links (`story_id` → slug). */
  storySlugById: Record<string, string>;
}

export default function HighProfileCasesSection({
  body,
  cases,
  storySlugById,
}: HighProfileCasesSectionProps) {
  const [filter, setFilter] = useState<CaseFilter>("all");

  const filtered = useMemo(
    () => cases.filter((c) => matchesFilter(c, filter)),
    [cases, filter],
  );

  if (cases.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 md:mt-16 border-t border-charcoal/10 pt-10 md:pt-12">
      <h2 className="font-serif text-2xl text-charcoal tracking-tight">
        High-Profile Cases
      </h2>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTER_CHIPS.map((chip) => {
          const on = filter === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilter(chip.id)}
              className={[
                "rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition",
                on
                  ? "border-amber bg-amber/10 text-amber"
                  : "border-charcoal/15 text-charcoal/60 hover:border-charcoal/25",
              ].join(" ")}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <ul className="mt-8 space-y-8">
        {filtered.map((c) => {
          const badge = outcomeBadge(c.outcome);
          const yearRange =
            c.case_year_end != null && c.case_year_end !== c.case_year_start
              ? `${c.case_year_start}–${c.case_year_end}`
              : String(c.case_year_start);
          return (
            <li
              key={c.id}
              className="rounded-2xl border border-charcoal/10 bg-charcoal/[0.03] p-5 md:p-6"
            >
              <p className="font-mono text-[11px] text-charcoal/45">{yearRange}</p>
              <h3 className="mt-1 font-serif text-base md:text-lg text-charcoal">
                {c.case_name}
              </h3>
              {c.accused_names.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {c.accused_names.map((name) => (
                    <span
                      key={name}
                      className="rounded border border-charcoal/12 bg-cream/80 px-2 py-0.5 font-mono text-[10px] text-charcoal/75"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              ) : null}
              {c.charge_summary ? (
                <p className="mt-3 text-sm leading-relaxed text-charcoal/80">
                  {c.charge_summary}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={[
                    "inline-flex rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider",
                    badge.className,
                  ].join(" ")}
                >
                  {badge.label}
                </span>
                {c.value_rands ? (
                  <span className="font-mono text-[11px] text-amber">
                    {formatRands(c.value_rands)} involved
                  </span>
                ) : null}
              </div>

              {c.outcome_detail ? (
                <details className="mt-3 group">
                  <summary className="cursor-pointer font-mono text-[11px] text-legal-blue hover:underline">
                    Outcome detail
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-charcoal/75 pl-3 border-l-2 border-legal-blue/30">
                    {c.outcome_detail}
                  </p>
                </details>
              ) : null}

              {c.plain_english ? (
                <details className="mt-2 group">
                  <summary className="cursor-pointer font-mono text-[11px] text-amber hover:underline">
                    Plain English
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-charcoal/75 pl-3 border-l-2 border-amber/30">
                    {c.plain_english}
                  </p>
                </details>
              ) : null}

              {c.story_id ? (
                <p className="mt-4">
                  {storySlugById[c.story_id] ? (
                    <Link
                      href={`/story/${storySlugById[c.story_id]}`}
                      className="font-mono text-[12px] text-amber hover:underline"
                    >
                      → Full story
                    </Link>
                  ) : (
                    <span className="font-mono text-[11px] text-charcoal/45">
                      Linked story (see timeline)
                    </span>
                  )}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 ? (
        <p className="mt-6 text-sm text-charcoal/55">No cases in this filter.</p>
      ) : null}

      {body.status === "disbanded" && body.cases_outcome_after_transfer ? (
        <TransferOutcomePanel body={body} />
      ) : null}
    </section>
  );
}

function TransferOutcomePanel({ body }: { body: AccountabilityBody }) {
  const t = body.cases_outcome_after_transfer ?? "";
  const transferred = body.cases_transferred_on_dissolution;
  const mConvict = t.match(/(\d+)\s+convictions/i);
  const convictions = mConvict ? Number(mConvict[1]) : null;

  return (
    <div className="mt-12 rounded-2xl border-2 border-charge-red/25 bg-charge-red/[0.04] p-6 md:p-8">
      <h3 className="font-serif text-xl text-charge-red tracking-tight">
        What happened to transferred cases
      </h3>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {transferred != null ? (
          <div className="rounded-xl bg-cream/90 border border-charcoal/10 p-4 text-center">
            <p className="font-serif text-3xl text-amber tabular-nums">{transferred}</p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-charcoal/50">
              Cases transferred
            </p>
          </div>
        ) : null}
        {convictions != null ? (
          <div className="rounded-xl bg-cream/90 border border-charcoal/10 p-4 text-center">
            <p className="font-serif text-3xl text-charcoal tabular-nums">{convictions}</p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-charcoal/50">
              Convictions after transfer
            </p>
          </div>
        ) : null}
        <div className="rounded-xl bg-cream/90 border border-charcoal/10 p-4 text-center sm:col-span-2">
          <p className="font-serif text-lg text-timeline-green">93%</p>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-charcoal/50">
            Scorpions conviction rate (benchmark)
          </p>
        </div>
        <div className="rounded-xl bg-cream/90 border border-charcoal/10 p-4 text-center sm:col-span-2">
          <p className="font-serif text-lg text-charge-red">~15%</p>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-charcoal/50">
            Approx. rate on transferred caseload (Hawks era)
          </p>
        </div>
      </div>
      <p className="mt-6 text-sm leading-relaxed text-charcoal/85 font-serif">
        {t}
      </p>
    </div>
  );
}
