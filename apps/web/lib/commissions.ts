/**
 * Shared labels / formatters / colour helpers for Commission UI components.
 *
 * These are pure functions — safe to import from both server and client
 * components. Centralising them here guarantees that the index, detail, and
 * related-commissions views all speak exactly the same visual language.
 */

import type {
  CommissionDomain,
  CommissionLawSectionUsage,
  CommissionPersonRole,
  CommissionStatus,
  CommissionSummary,
} from "@the-record/shared-types";

// -----------------------------------------------------------------------------
// Labels
// -----------------------------------------------------------------------------

export const COMMISSION_DOMAIN_LABELS: Record<CommissionDomain, string> = {
  criminal_justice: "Criminal Justice",
  politics: "Politics",
  organised_crime: "Organised Crime",
  business: "Business",
  labour: "Labour",
  human_rights: "Human Rights",
  financial: "Financial",
  education: "Education",
  policing: "Policing",
  public_safety: "Public Safety",
  corruption: "Corruption",
};

export const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
  active: "Active",
  concluded: "Concluded",
  pending_report: "Pending Report",
  stalled: "Stalled",
  never_reported: "Never Reported",
};

export const COMMISSION_PERSON_ROLE_LABELS: Record<
  CommissionPersonRole,
  string
> = {
  chair: "Chair",
  evidence_leader: "Evidence Leader",
  witness: "Witness",
  implicated: "Implicated",
  legal_rep: "Legal Representative",
  commissioner: "Commissioner",
  secretary: "Secretary",
  subject_of_inquiry: "Subject of Inquiry",
  established_by: "Established by",
};

export const COMMISSION_LAW_USAGE_LABELS: Record<
  CommissionLawSectionUsage,
  string
> = {
  enabling: "Laws that enabled this commission",
  investigated: "Laws investigated for violations",
  violated: "Laws found to have been violated",
  recommended: "Laws recommended for change",
};

/** The order used when grouping people in the detail page. */
export const COMMISSION_PERSON_ROLE_ORDER: CommissionPersonRole[] = [
  "chair",
  "commissioner",
  "evidence_leader",
  "secretary",
  "legal_rep",
  "established_by",
  "subject_of_inquiry",
  "implicated",
  "witness",
];

// -----------------------------------------------------------------------------
// Colour helpers (Tailwind classes — literals so the JIT can pick them up)
// -----------------------------------------------------------------------------

/** Background + text colour for a domain chip. */
export function domainChipClasses(domain: CommissionDomain): {
  bg: string;
  text: string;
  border: string;
} {
  switch (domain) {
    case "criminal_justice":
      return {
        bg: "bg-charge-red/10",
        text: "text-charge-red",
        border: "border-charge-red/20",
      };
    case "corruption":
      return {
        bg: "bg-amber/15",
        text: "text-amber",
        border: "border-amber/25",
      };
    case "financial":
      return {
        bg: "bg-legal-blue/10",
        text: "text-legal-blue",
        border: "border-legal-blue/20",
      };
    case "policing":
    case "public_safety":
      return {
        bg: "bg-charcoal/[0.08]",
        text: "text-charcoal",
        border: "border-charcoal/15",
      };
    case "human_rights":
      return {
        bg: "bg-constitutional-gold/15",
        text: "text-constitutional-gold",
        border: "border-constitutional-gold/25",
      };
    case "education":
      return {
        bg: "bg-timeline-green/12",
        text: "text-timeline-green",
        border: "border-timeline-green/25",
      };
    case "politics":
      return {
        bg: "bg-legal-blue/10",
        text: "text-legal-blue",
        border: "border-legal-blue/20",
      };
    case "organised_crime":
      return {
        bg: "bg-charge-red/10",
        text: "text-charge-red",
        border: "border-charge-red/20",
      };
    case "business":
    case "labour":
    default:
      return {
        bg: "bg-charcoal/[0.06]",
        text: "text-charcoal/75",
        border: "border-charcoal/15",
      };
  }
}

/** Inline badge classes for a commission status. Matches our StatusBadge language. */
export function statusBadgeClasses(status: CommissionStatus): {
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
        label: COMMISSION_STATUS_LABELS.active,
      };
    case "concluded":
      return {
        bg: "bg-timeline-green",
        text: "text-white",
        dot: "bg-white/90",
        label: COMMISSION_STATUS_LABELS.concluded,
      };
    case "pending_report":
      return {
        bg: "bg-yellow-300",
        text: "text-charcoal",
        dot: "bg-charcoal/70",
        label: COMMISSION_STATUS_LABELS.pending_report,
      };
    case "stalled":
      return {
        bg: "bg-charcoal/20",
        text: "text-charcoal",
        dot: "bg-charcoal/60",
        label: COMMISSION_STATUS_LABELS.stalled,
      };
    case "never_reported":
    default:
      return {
        bg: "bg-charge-red/15",
        text: "text-charge-red",
        dot: "bg-charge-red",
        label: COMMISSION_STATUS_LABELS.never_reported,
      };
  }
}

// -----------------------------------------------------------------------------
// Formatters
// -----------------------------------------------------------------------------

const SAST_LOCALE = "en-ZA";
const SAST_TIMEZONE = "Africa/Johannesburg";

/** `"2025-09-17"` → `"17 September 2025"`. Returns the input string on parse failure. */
export function formatLongDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(SAST_LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: SAST_TIMEZONE,
  }).format(d);
}

/** `"2025-09-17"` → `"2025"`. Falls back to `"—"` if no year can be derived. */
export function extractYear(iso: string | null | undefined): string {
  if (!iso) return "—";
  const match = iso.match(/^(\d{4})/);
  if (match) return match[1];
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return String(d.getUTCFullYear());
}

/**
 * Pick the most representative "year" for a commission row — the year it was
 * announced, or failing that, when hearings started or it reported.
 */
export function commissionEraYear(commission: CommissionSummary): string {
  return extractYear(
    commission.announced_date ??
      commission.hearings_started ??
      commission.report_released_date ??
      commission.concluded_date,
  );
}

/**
 * Calendar-day duration between two ISO date strings. Returns null if either
 * endpoint is missing or unparseable. Never negative.
 */
export function durationInDays(
  startIso: string | null | undefined,
  endIso: string | null | undefined,
): number | null {
  if (!startIso || !endIso) return null;
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const ms = end.getTime() - start.getTime();
  if (ms <= 0) return null;
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/** `"894"` → `"894 days"`. `"400"` → `"1 yr 1 mo"` formatted coarsely. */
export function formatDurationDays(days: number | null): string {
  if (days == null || days <= 0) return "—";
  if (days < 90) return `${days} days`;
  const years = Math.floor(days / 365);
  const rem = days - years * 365;
  const months = Math.round(rem / 30);
  if (years === 0) return `${months} mo`;
  if (months === 0) return `${years} yr`;
  return `${years} yr ${months} mo`;
}

/**
 * `"1000000000"` (rands as bigint string) → `"R1.0bn"`.
 * Uses decimal magnitudes — R (rands), K (thousand), M (million), B (billion).
 */
export function formatRandsCompact(
  rands: string | null | undefined,
): string {
  if (!rands) return "—";
  const n = Number(rands);
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 1_000_000_000) return `R${(n / 1_000_000_000).toFixed(1)}bn`;
  if (n >= 1_000_000) return `R${(n / 1_000_000).toFixed(0)}m`;
  if (n >= 1_000) return `R${(n / 1_000).toFixed(0)}k`;
  return `R${n.toLocaleString("en-ZA")}`;
}

// -----------------------------------------------------------------------------
// Prosecution indicator
// -----------------------------------------------------------------------------

/**
 * Descriptor for the `produced_prosecutions` flag on a commission:
 *
 *   true  → green dot, "Led to prosecutions"
 *   false → red dot,   "No prosecutions resulted"
 *   null  → gray dot,  "Outcome unknown"
 *
 * Lives in the shared `lib/commissions.ts` (not inside any component file)
 * so both server and client components can import it without crossing the
 * RSC boundary.
 */
export interface ProsecutionDescriptor {
  label: string;
  dotClass: string;
  textClass: string;
}

export function prosecutionDescriptor(
  value: boolean | null,
): ProsecutionDescriptor {
  if (value === true) {
    return {
      label: "Led to prosecutions",
      dotClass: "bg-timeline-green",
      textClass: "text-timeline-green",
    };
  }
  if (value === false) {
    return {
      label: "No prosecutions resulted",
      dotClass: "bg-charge-red",
      textClass: "text-charge-red",
    };
  }
  return {
    label: "Outcome unknown",
    dotClass: "bg-charcoal/35",
    textClass: "text-charcoal/55",
  };
}

/** Sum the non-null cost_rands across a list, returning a bigint-safe string. */
export function sumCostRands(
  commissions: Array<Pick<CommissionSummary, "cost_rands">>,
): string {
  let total = 0n;
  for (const c of commissions) {
    if (!c.cost_rands) continue;
    try {
      total += BigInt(c.cost_rands);
    } catch {
      // Ignore non-integer strings; the API guarantees digit-only serialisation.
    }
  }
  return total.toString();
}
