/**
 * Shared labels / formatters / colour helpers for Ad Hoc Committee UI.
 *
 * Pure functions only — safe to import from both server and client
 * components. The `domain` colour mapping deliberately reuses
 * {@link domainChipClasses} from `lib/commissions.ts` (committees use the
 * same `CommissionDomain` enum), so a "Politics" chip looks identical
 * regardless of which body it came from.
 */

import type {
  AdhocCommittee,
  AdhocCommitteeCategory,
  AdhocCommitteePersonRole,
  AdhocCommitteeStatus,
} from "@the-record/shared-types";

import { extractYear } from "./commissions";

// -----------------------------------------------------------------------------
// Labels
// -----------------------------------------------------------------------------

export const ADHOC_CATEGORY_LABELS: Record<AdhocCommitteeCategory, string> = {
  accountability: "Accountability",
  constitutional_amendment: "Constitutional Amendment",
  legislation: "Legislation",
  appointments: "Appointments",
  disaster_response: "Disaster Response",
  oversight: "Oversight",
  other: "Other",
};

export const ADHOC_STATUS_LABELS: Record<AdhocCommitteeStatus, string> = {
  active: "Active",
  concluded: "Concluded",
  lapsed: "Lapsed",
  mandate_completed: "Mandate completed",
};

export const ADHOC_PERSON_ROLE_LABELS: Record<AdhocCommitteePersonRole, string> = {
  chair: "Chair",
  member: "Member",
  witness: "Witness",
  implicated: "Implicated",
  legal_rep: "Legal Representative",
  secretary: "Secretary",
};

// -----------------------------------------------------------------------------
// Colour helpers (Tailwind classes — literals so the JIT can pick them up)
// -----------------------------------------------------------------------------

/** Inline badge classes for an ad hoc committee status. */
export function adhocStatusBadgeClasses(status: AdhocCommitteeStatus): {
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
        label: ADHOC_STATUS_LABELS.active,
      };
    case "concluded":
    case "mandate_completed":
      return {
        bg: "bg-timeline-green",
        text: "text-white",
        dot: "bg-white/90",
        label: ADHOC_STATUS_LABELS[status],
      };
    case "lapsed":
    default:
      return {
        bg: "bg-charcoal/20",
        text: "text-charcoal",
        dot: "bg-charcoal/60",
        label: ADHOC_STATUS_LABELS.lapsed,
      };
  }
}

/** Background + text colour for a committee category badge. */
export function adhocCategoryChipClasses(category: AdhocCommitteeCategory): {
  bg: string;
  text: string;
  border: string;
} {
  switch (category) {
    case "accountability":
      return {
        bg: "bg-charge-red/10",
        text: "text-charge-red",
        border: "border-charge-red/20",
      };
    case "constitutional_amendment":
      return {
        bg: "bg-constitutional-gold/15",
        text: "text-constitutional-gold",
        border: "border-constitutional-gold/25",
      };
    case "legislation":
      return {
        bg: "bg-legal-blue/10",
        text: "text-legal-blue",
        border: "border-legal-blue/20",
      };
    case "appointments":
      return {
        bg: "bg-amber/15",
        text: "text-amber",
        border: "border-amber/25",
      };
    case "disaster_response":
      return {
        bg: "bg-charge-red/10",
        text: "text-charge-red",
        border: "border-charge-red/20",
      };
    case "oversight":
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

// -----------------------------------------------------------------------------
// Era + outcome derivers
// -----------------------------------------------------------------------------

/** The "era year" used in row metadata — earliest signal we have. */
export function adhocEraYear(committee: AdhocCommittee): string {
  return extractYear(
    committee.announced_date ??
      committee.first_meeting_date ??
      committee.report_adopted_date ??
      committee.concluded_date,
  );
}

/**
 * Did the committee actually achieve something measurable? Rolls
 * `produced_accountability_action` and `produced_legislative_change` into
 * a single tri-state descriptor — the committee analogue of a commission's
 * `produced_prosecutions` flag.
 */
export interface AccountabilityActionDescriptor {
  label: string;
  dotClass: string;
  textClass: string;
}

export function accountabilityActionDescriptor(
  committee: Pick<
    AdhocCommittee,
    "produced_accountability_action" | "produced_legislative_change" | "status"
  >,
): AccountabilityActionDescriptor {
  if (committee.produced_accountability_action === true) {
    return {
      label: "Produced accountability action",
      dotClass: "bg-timeline-green",
      textClass: "text-timeline-green",
    };
  }
  if (committee.produced_legislative_change === true) {
    return {
      label: "Produced legislative change",
      dotClass: "bg-timeline-green",
      textClass: "text-timeline-green",
    };
  }
  if (
    committee.produced_accountability_action === false &&
    committee.produced_legislative_change === false
  ) {
    return {
      label: "No action produced",
      dotClass: "bg-charge-red",
      textClass: "text-charge-red",
    };
  }
  if (committee.status === "active") {
    return {
      label: "Outcome pending — committee active",
      dotClass: "bg-amber",
      textClass: "text-amber",
    };
  }
  return {
    label: "Outcome unknown",
    dotClass: "bg-charcoal/35",
    textClass: "text-charcoal/55",
  };
}

/**
 * Did the committee produce *any* concrete outcome? Used to compute the
 * "produced real consequences" stat on the index page. A committee counts
 * if EITHER flag is true; explicit false on both means no.
 */
export function producedAnyOutcome(
  committee: Pick<
    AdhocCommittee,
    "produced_accountability_action" | "produced_legislative_change"
  >,
): boolean {
  return (
    committee.produced_accountability_action === true ||
    committee.produced_legislative_change === true
  );
}
