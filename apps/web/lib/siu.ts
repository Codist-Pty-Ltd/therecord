/**
 * Shared labels / formatters / colour helpers for SIU UI components.
 *
 * Pure functions only — safe to import from both server and client
 * components. Mirrors the convention established in `lib/commissions.ts`
 * and `lib/adhoc.ts`. The `domain` chip mapping is reused from
 * `lib/commissions.ts` since the SIU proclamation entity uses the same
 * `CommissionDomain` enum — a "Corruption" chip looks identical
 * regardless of which body it came from.
 */

import type {
  ProclamationStatus,
  SiuPersonRole,
  TribunalCaseStatus,
} from "@the-record/shared-types";

// -----------------------------------------------------------------------------
// Labels
// -----------------------------------------------------------------------------

export const PROCLAMATION_STATUS_LABELS: Record<ProclamationStatus, string> = {
  active: "Active",
  concluded: "Concluded",
  report_submitted: "Report Submitted",
  litigation_ongoing: "Litigation Ongoing",
};

export const TRIBUNAL_CASE_STATUS_LABELS: Record<TribunalCaseStatus, string> = {
  pending: "Pending",
  hearing: "In Hearing",
  judgment_delivered: "Judgment Delivered",
  settled: "Settled",
  withdrawn: "Withdrawn",
  appeal_pending: "Appeal Pending",
};

export const SIU_PERSON_ROLE_LABELS: Record<SiuPersonRole, string> = {
  investigated: "Investigated",
  implicated: "Implicated",
  whistleblower: "Whistleblower",
  referred_to_npa: "Referred to NPA",
  referred_disciplinary: "Disciplinary Referral",
  convicted: "Convicted",
  acquitted: "Acquitted",
};

// -----------------------------------------------------------------------------
// Tab grouping for the proclamations list
//
// The /siu page shows three tabs: Active | Concluded | Litigation Ongoing.
// `report_submitted` rolls into "Concluded" — once the SIU has reported to
// the President the matter is concluded from the investigation perspective,
// even if recovery litigation continues separately.
// -----------------------------------------------------------------------------

export type ProclamationTab = "active" | "concluded" | "litigation";

export const PROCLAMATION_TAB_LABELS: Record<ProclamationTab, string> = {
  active: "Active",
  concluded: "Concluded",
  litigation: "Litigation Ongoing",
};

export function tabForProclamationStatus(
  status: ProclamationStatus,
): ProclamationTab {
  switch (status) {
    case "active":
      return "active";
    case "litigation_ongoing":
      return "litigation";
    case "concluded":
    case "report_submitted":
    default:
      return "concluded";
  }
}

// -----------------------------------------------------------------------------
// Status badges
// -----------------------------------------------------------------------------

/** Pill classes for a proclamation status — matches the visual language of
 *  the commission/committee status badges. */
export function proclamationStatusBadgeClasses(status: ProclamationStatus): {
  bg: string;
  text: string;
  dot: string;
  label: string;
} {
  switch (status) {
    case "active":
      return {
        bg: "bg-amber",
        text: "text-white",
        dot: "bg-white/90",
        label: PROCLAMATION_STATUS_LABELS.active,
      };
    case "litigation_ongoing":
      return {
        bg: "bg-legal-blue",
        text: "text-white",
        dot: "bg-white/90",
        label: PROCLAMATION_STATUS_LABELS.litigation_ongoing,
      };
    case "report_submitted":
      return {
        bg: "bg-yellow-300",
        text: "text-charcoal",
        dot: "bg-charcoal/70",
        label: PROCLAMATION_STATUS_LABELS.report_submitted,
      };
    case "concluded":
    default:
      return {
        bg: "bg-timeline-green",
        text: "text-white",
        dot: "bg-white/90",
        label: PROCLAMATION_STATUS_LABELS.concluded,
      };
  }
}

/**
 * Pill classes for a tribunal case status. The colour palette is tied to
 * the prompt: pending → gray, hearing → amber (pulsing dot, owned by the
 * caller via `dotPulse`), judgment_delivered → green or red depending on
 * whether anything was recovered, settled → blue, appeal_pending → yellow,
 * withdrawn → muted gray.
 */
export interface TribunalStatusDescriptor {
  bg: string;
  text: string;
  dot: string;
  label: string;
  /** True when the dot should pulse to draw the eye (hearing in progress). */
  dotPulse: boolean;
}

export function tribunalCaseStatusDescriptor(
  status: TribunalCaseStatus,
  amountRecovered: string | null,
): TribunalStatusDescriptor {
  switch (status) {
    case "hearing":
      return {
        bg: "bg-amber/15",
        text: "text-amber",
        dot: "bg-amber",
        label: TRIBUNAL_CASE_STATUS_LABELS.hearing,
        dotPulse: true,
      };
    case "judgment_delivered": {
      const recovered =
        amountRecovered !== null &&
        amountRecovered !== "" &&
        Number(amountRecovered) > 0;
      return recovered
        ? {
            bg: "bg-timeline-green/15",
            text: "text-timeline-green",
            dot: "bg-timeline-green",
            label: "Judgment — Recovered",
            dotPulse: false,
          }
        : {
            bg: "bg-charge-red/12",
            text: "text-charge-red",
            dot: "bg-charge-red",
            label: "Judgment — No Recovery",
            dotPulse: false,
          };
    }
    case "settled":
      return {
        bg: "bg-legal-blue/12",
        text: "text-legal-blue",
        dot: "bg-legal-blue",
        label: TRIBUNAL_CASE_STATUS_LABELS.settled,
        dotPulse: false,
      };
    case "appeal_pending":
      return {
        bg: "bg-constitutional-gold/15",
        text: "text-constitutional-gold",
        dot: "bg-constitutional-gold",
        label: TRIBUNAL_CASE_STATUS_LABELS.appeal_pending,
        dotPulse: false,
      };
    case "withdrawn":
      return {
        bg: "bg-charcoal/[0.08]",
        text: "text-charcoal/60",
        dot: "bg-charcoal/45",
        label: TRIBUNAL_CASE_STATUS_LABELS.withdrawn,
        dotPulse: false,
      };
    case "pending":
    default:
      return {
        bg: "bg-charcoal/[0.08]",
        text: "text-charcoal/70",
        dot: "bg-charcoal/55",
        label: TRIBUNAL_CASE_STATUS_LABELS.pending,
        dotPulse: false,
      };
  }
}

// -----------------------------------------------------------------------------
// Headline number formatting
//
// The `/siu` hero leads with four enormous numbers. They have to render
// without committing the API to a particular schema (the prompt's example
// values — R64.8bn enrolled, R389m recovered, R2.1bn prevented, 87+ NPA
// referrals on PPE alone — all match the seeded data, but we still need
// formatters that gracefully degrade when figures are missing).
// -----------------------------------------------------------------------------

/**
 * Format a Rand bigint string as a hero-sized headline figure.
 * Examples: "64800000000" → "R64.8bn", "389000000" → "R389m", "0" → "—".
 *
 * Differs from `formatRandsCompact` in `lib/commissions.ts` by emitting
 * one decimal of precision for billions (the hero leads with the money,
 * so "R64.8bn" reads better than "R65bn").
 */
export function formatRandsHero(rands: string | null | undefined): string {
  if (!rands) return "—";
  const n = Number(rands);
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 1_000_000_000) {
    const value = n / 1_000_000_000;
    return value >= 100
      ? `R${Math.round(value)}bn`
      : `R${value.toFixed(1).replace(/\.0$/, "")}bn`;
  }
  if (n >= 1_000_000) return `R${Math.round(n / 1_000_000)}m`;
  if (n >= 1_000) return `R${Math.round(n / 1_000)}k`;
  return `R${n.toLocaleString("en-ZA")}`;
}

/**
 * Format an integer with a trailing "+" once we cross 10 — matches the
 * editorial tone of the hero copy ("87+ cases referred to NPA").
 * `null`, `undefined`, and 0 collapse to "0" so the hero still renders
 * a tile rather than going blank.
 */
export function formatCountHero(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return "0";
  if (value >= 10) return `${value.toLocaleString("en-ZA")}+`;
  return String(value);
}
