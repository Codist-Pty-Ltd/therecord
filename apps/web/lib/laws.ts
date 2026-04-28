/**
 * Shared labels / formatters / colour helpers for Laws UI components.
 *
 * Pure functions — safe to import from both server and client components.
 * Centralising them here means the laws index, section detail, and any
 * future "applied in" surfaces use exactly the same visual language.
 *
 * Note: the two usage-type enums (commission vs ad hoc committee) are
 * deliberately separate because they have different states. We expose
 * one `lawSectionUsageDescriptor()` that accepts both unions and dispatches
 * internally, plus narrow per-table label maps for places that only deal
 * with one side.
 */

import type {
  AdhocCommitteeLawSectionUsage,
  CommissionLawSectionUsage,
  LawCategory,
  LawSummary,
  SiuLawUsageType,
} from "@the-record/shared-types";

// -----------------------------------------------------------------------------
// Labels
// -----------------------------------------------------------------------------

export const LAW_CATEGORY_LABELS: Record<LawCategory, string> = {
  corruption: "Corruption",
  policing: "Policing",
  prosecution: "Prosecution",
  organised_crime: "Organised Crime",
  whistleblower: "Whistleblower",
  constitutional: "Constitutional",
  other: "Other",
};

/**
 * Friendly category headings used to bucket the editorial law list. Keep the
 * order — readers scan the page top-down so put the headline buckets first.
 */
export const LAW_CATEGORY_ORDER: LawCategory[] = [
  "corruption",
  "policing",
  "prosecution",
  "organised_crime",
  "whistleblower",
  "constitutional",
  "other",
];

/** Plain-English explainer of each `usage_type` — short enough to chip. */
export const COMMISSION_USAGE_CHIP_LABELS: Record<
  CommissionLawSectionUsage,
  string
> = {
  enabling: "Enabling",
  investigated: "Investigated",
  violated: "Violated",
  recommended: "Recommended",
};

export const ADHOC_USAGE_CHIP_LABELS: Record<
  AdhocCommitteeLawSectionUsage,
  string
> = {
  enabling: "Enabling",
  investigated: "Investigated",
  amended: "Amended",
  being_processed: "Being processed",
};

/** Longer, sentence-style label used in tooltips and accessible labels. */
export const COMMISSION_USAGE_LONG_LABELS: Record<
  CommissionLawSectionUsage,
  string
> = {
  enabling: "Enabled this commission",
  investigated: "Investigated for violations",
  violated: "Found to have been violated",
  recommended: "Recommended for change",
};

export const ADHOC_USAGE_LONG_LABELS: Record<
  AdhocCommitteeLawSectionUsage,
  string
> = {
  enabling: "Enabled this committee",
  investigated: "Investigated for violations",
  amended: "Amended by this committee",
  being_processed: "Currently being amended in committee",
};

// -----------------------------------------------------------------------------
// Colour helpers (Tailwind utility class literals — keep them whole strings
// so the JIT can pick them up at build time)
// -----------------------------------------------------------------------------

export interface CategoryChipClasses {
  bg: string;
  text: string;
  border: string;
}

export function categoryChipClasses(category: LawCategory): CategoryChipClasses {
  switch (category) {
    case "corruption":
      return {
        bg: "bg-amber/15",
        text: "text-amber",
        border: "border-amber/25",
      };
    case "constitutional":
      return {
        bg: "bg-constitutional-gold/15",
        text: "text-constitutional-gold",
        border: "border-constitutional-gold/25",
      };
    case "policing":
      return {
        bg: "bg-legal-blue/10",
        text: "text-legal-blue",
        border: "border-legal-blue/20",
      };
    case "prosecution":
      return {
        bg: "bg-charcoal/[0.08]",
        text: "text-charcoal",
        border: "border-charcoal/15",
      };
    case "organised_crime":
      return {
        bg: "bg-charge-red/10",
        text: "text-charge-red",
        border: "border-charge-red/20",
      };
    case "whistleblower":
      return {
        bg: "bg-timeline-green/12",
        text: "text-timeline-green",
        border: "border-timeline-green/25",
      };
    case "other":
    default:
      return {
        bg: "bg-charcoal/[0.06]",
        text: "text-charcoal/75",
        border: "border-charcoal/15",
      };
  }
}

export interface UsageChipClasses {
  bg: string;
  text: string;
  border: string;
  /** Short label — already locale-correct for chip use. */
  label: string;
  /** Longer sentence form used for `aria-label` and tooltip content. */
  longLabel: string;
}

/**
 * Pick the chip styling for a commission's relationship to a section.
 * `enabling` is amber (signal of authority), `violated` is red (signal of
 * harm), `investigated` is the legal-blue accent, `recommended` is gold.
 */
export function commissionUsageChip(
  usage: CommissionLawSectionUsage,
): UsageChipClasses {
  switch (usage) {
    case "enabling":
      return {
        bg: "bg-amber/12",
        text: "text-amber",
        border: "border-amber/25",
        label: COMMISSION_USAGE_CHIP_LABELS.enabling,
        longLabel: COMMISSION_USAGE_LONG_LABELS.enabling,
      };
    case "violated":
      return {
        bg: "bg-charge-red/12",
        text: "text-charge-red",
        border: "border-charge-red/25",
        label: COMMISSION_USAGE_CHIP_LABELS.violated,
        longLabel: COMMISSION_USAGE_LONG_LABELS.violated,
      };
    case "recommended":
      return {
        bg: "bg-constitutional-gold/15",
        text: "text-constitutional-gold",
        border: "border-constitutional-gold/25",
        label: COMMISSION_USAGE_CHIP_LABELS.recommended,
        longLabel: COMMISSION_USAGE_LONG_LABELS.recommended,
      };
    case "investigated":
    default:
      return {
        bg: "bg-legal-blue/10",
        text: "text-legal-blue",
        border: "border-legal-blue/20",
        label: COMMISSION_USAGE_CHIP_LABELS.investigated,
        longLabel: COMMISSION_USAGE_LONG_LABELS.investigated,
      };
  }
}

export function adhocUsageChip(
  usage: AdhocCommitteeLawSectionUsage,
): UsageChipClasses {
  switch (usage) {
    case "enabling":
      return {
        bg: "bg-amber/12",
        text: "text-amber",
        border: "border-amber/25",
        label: ADHOC_USAGE_CHIP_LABELS.enabling,
        longLabel: ADHOC_USAGE_LONG_LABELS.enabling,
      };
    case "amended":
      return {
        bg: "bg-timeline-green/12",
        text: "text-timeline-green",
        border: "border-timeline-green/25",
        label: ADHOC_USAGE_CHIP_LABELS.amended,
        longLabel: ADHOC_USAGE_LONG_LABELS.amended,
      };
    case "being_processed":
      return {
        bg: "bg-yellow-300/35",
        text: "text-charcoal",
        border: "border-yellow-300/60",
        label: ADHOC_USAGE_CHIP_LABELS.being_processed,
        longLabel: ADHOC_USAGE_LONG_LABELS.being_processed,
      };
    case "investigated":
    default:
      return {
        bg: "bg-legal-blue/10",
        text: "text-legal-blue",
        border: "border-legal-blue/20",
        label: ADHOC_USAGE_CHIP_LABELS.investigated,
        longLabel: ADHOC_USAGE_LONG_LABELS.investigated,
      };
  }
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Pull the trailing year out of an act number like "12 of 2004".
 * Falls back to `null` when the string doesn't match (we never want to
 * surface a half-parsed string to the UI).
 */
export function extractActYear(actNumber: string | null | undefined): string | null {
  if (!actNumber) return null;
  const m = actNumber.match(/(\d{4})\s*$/);
  return m ? m[1] : null;
}

/**
 * Group a flat array of laws by their {@link LawCategory}, preserving the
 * original within-category sort order. Categories with no laws are omitted.
 */
export function groupLawsByCategory<T extends Pick<LawSummary, "category">>(
  laws: T[],
): Array<{ category: LawCategory; laws: T[] }> {
  const buckets = new Map<LawCategory, T[]>();
  for (const law of laws) {
    const existing = buckets.get(law.category);
    if (existing) {
      existing.push(law);
    } else {
      buckets.set(law.category, [law]);
    }
  }
  return LAW_CATEGORY_ORDER.filter((c) => buckets.has(c)).map((c) => ({
    category: c,
    laws: buckets.get(c) ?? [],
  }));
}

/**
 * Pluralise "section" without an i18n library. Used in row counters across
 * the laws index and section detail page.
 */
export function pluraliseSections(count: number): string {
  return `${count} ${count === 1 ? "section" : "sections"}`;
}

// -----------------------------------------------------------------------------
// SIU — usage chips on `siu_proclamation_law_sections` (not commission usage)
// -----------------------------------------------------------------------------

const SIU_USAGE_LONG: Record<SiuLawUsageType, string> = {
  enabling: "Enabled this investigation",
  investigated: "Under investigation",
  violated: "Found violated",
  recovered_under: "Used to recover funds",
};

/**
 * Styling for SIU `usage_type` on the law section "Applied in" strip. Labels
 * are the editorial set from the product spec, distinct from
 * `commissionUsageChip` / `adhocUsageChip`.
 */
export function siuUsageChip(usage: SiuLawUsageType): UsageChipClasses {
  switch (usage) {
    case "enabling":
      return {
        bg: "bg-charcoal/10",
        text: "text-charcoal/85",
        border: "border-charcoal/20",
        label: SIU_USAGE_LONG.enabling,
        longLabel: SIU_USAGE_LONG.enabling,
      };
    case "violated":
      return {
        bg: "bg-charge-red/12",
        text: "text-charge-red",
        border: "border-charge-red/25",
        label: SIU_USAGE_LONG.violated,
        longLabel: SIU_USAGE_LONG.violated,
      };
    case "recovered_under":
      return {
        bg: "bg-timeline-green/12",
        text: "text-timeline-green",
        border: "border-timeline-green/25",
        label: SIU_USAGE_LONG.recovered_under,
        longLabel: SIU_USAGE_LONG.recovered_under,
      };
    case "investigated":
    default:
      return {
        bg: "bg-amber/12",
        text: "text-amber",
        border: "border-amber/25",
        label: SIU_USAGE_LONG.investigated,
        longLabel: SIU_USAGE_LONG.investigated,
      };
  }
}
