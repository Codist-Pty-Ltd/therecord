/**
 * Shared labels / formatters / colour helpers for Person UI components.
 *
 * Pure functions — safe to import from both server and client components.
 * Centralising them here keeps the `/person/[id]` page, future `/people`
 * index, and any inline person cards speaking the same visual language.
 */

import type {
  EventType,
  PersonCommissionAppearance,
  PersonEventAppearance,
  PersonStatus,
} from "@the-record/shared-types";

import type { StatusBadgeVariant } from "@/components/ui/StatusBadge";

// -----------------------------------------------------------------------------
// Labels
// -----------------------------------------------------------------------------

export const PERSON_STATUS_LABELS: Record<PersonStatus, string> = {
  active: "Active",
  suspended: "Suspended",
  charged: "Charged",
  acquitted: "Acquitted",
  resigned: "Resigned",
  unknown: "Unknown",
  deceased: "Deceased",
};

/**
 * `PersonStatus` includes `resigned` and `unknown`, which the `StatusBadge`
 * component doesn't model directly — both fall back to the neutral `dormant`
 * variant so the badge renders without a visual regression.
 */
export function personStatusToBadgeVariant(
  status: PersonStatus,
): StatusBadgeVariant {
  switch (status) {
    case "active":
      return "active";
    case "suspended":
      return "suspended";
    case "charged":
      return "charged";
    case "acquitted":
      return "acquitted";
    case "deceased":
      return "charged";
    case "resigned":
    case "unknown":
    default:
      return "dormant";
  }
}

// -----------------------------------------------------------------------------
// Avatar colour — per the person page spec
// -----------------------------------------------------------------------------

/**
 * Background classes for the large initials avatar in the person header. The
 * spec pins these four colours to the four most common legal states:
 *
 *   active    → charcoal   (neutral, in office)
 *   suspended → amber      (temporary / pending)
 *   charged   → charge-red (criminal proceedings live)
 *   acquitted → legal-blue (court cleared them)
 *
 * `resigned` and `unknown` fall through to charcoal/70 — the "we don't know
 * their current state" tone. This mapping is intentionally separate from the
 * `StatusBadge` palette because the avatar is big and should read as a
 * single continuous colour rather than a pill.
 */
export function personAvatarBgClass(status: PersonStatus): string {
  switch (status) {
    case "active":
      return "bg-charcoal";
    case "suspended":
      return "bg-amber";
    case "charged":
      return "bg-charge-red";
    case "deceased":
      return "bg-charge-red";
    case "acquitted":
      return "bg-legal-blue";
    case "resigned":
      return "bg-charcoal/70";
    case "unknown":
    default:
      return "bg-charcoal/55";
  }
}

// -----------------------------------------------------------------------------
// Initials
// -----------------------------------------------------------------------------

/**
 * Reduce a full name to up to two initial characters. Handles unicode names
 * and weird whitespace; always returns a non-empty string so the avatar
 * never renders blank.
 */
export function getPersonInitials(fullName: string): string {
  const parts = fullName
    .split(/\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0][0] ?? "?").toUpperCase();
  const first = parts[0][0] ?? "";
  const last = parts[parts.length - 1][0] ?? "";
  return (first + last).toUpperCase();
}

// -----------------------------------------------------------------------------
// Commission appearance → human label ("As witness at Zondo Commission")
// -----------------------------------------------------------------------------

const ROLE_VERB: Record<PersonCommissionAppearance["role"], string> = {
  chair: "Chaired",
  commissioner: "Commissioner on",
  evidence_leader: "Led evidence at",
  secretary: "Secretary of",
  legal_rep: "Legal representative at",
  established_by: "Established",
  subject_of_inquiry: "Subject of",
  implicated: "Implicated at",
  witness: "Testified at",
};

/**
 * Render a commission appearance as a single editorial sentence —
 * `"Implicated at Zondo Commission"`, `"Chaired the Marikana Commission"`.
 */
export function describeCommissionAppearance(
  appearance: PersonCommissionAppearance,
): string {
  const verb = ROLE_VERB[appearance.role];
  return `${verb} ${appearance.popular_name}`;
}

// -----------------------------------------------------------------------------
// Timeline node colouring (career timeline)
// -----------------------------------------------------------------------------

/** Categorisation used to colour nodes on the unified career timeline. */
export type CareerTimelineNodeKind =
  | "commission"
  | "criminal"
  | "legal"
  | "story";

/** Classify a story-level timeline event. */
export function classifyEventKind(
  type: EventType,
): CareerTimelineNodeKind {
  switch (type) {
    case "arrest":
    case "charge_filed":
      return "criminal";
    case "commission_established":
    case "hearing":
      return "commission";
    case "judgment":
    case "acquittal":
      return "legal";
    default:
      return "story";
  }
}

/** Dot + ring colours for a timeline node. */
export function careerNodeColourClasses(kind: CareerTimelineNodeKind): {
  dot: string;
  ring: string;
  text: string;
} {
  switch (kind) {
    case "commission":
      return {
        dot: "bg-legal-blue",
        ring: "ring-legal-blue/15",
        text: "text-legal-blue",
      };
    case "criminal":
      return {
        dot: "bg-charge-red",
        ring: "ring-charge-red/15",
        text: "text-charge-red",
      };
    case "legal":
      return {
        dot: "bg-timeline-green",
        ring: "ring-timeline-green/20",
        text: "text-timeline-green",
      };
    case "story":
    default:
      return {
        dot: "bg-amber",
        ring: "ring-amber/20",
        text: "text-amber",
      };
  }
}

// -----------------------------------------------------------------------------
// Events that count as a live criminal charge
// -----------------------------------------------------------------------------

const CHARGE_EVENT_TYPES: ReadonlySet<EventType> = new Set([
  "charge_filed",
  "arrest",
]);

/**
 * Does this person have any events in their sphere that represent live
 * criminal proceedings? Used to decide whether to render the legal-status
 * panel and its presumption-of-innocence disclaimer.
 *
 * Note: `events` comes back from the API as "every event from every story
 * this person is named in" — which is a proxy for "this person is inside a
 * story with active criminal proceedings" rather than a strict per-person
 * charge assertion. We're explicit about that in the UI copy.
 */
export function hasActiveChargeEvents(
  events: PersonEventAppearance[],
): boolean {
  return events.some((e) => CHARGE_EVENT_TYPES.has(e.event_type));
}

/** Filter down to just the events that look like criminal proceedings. */
export function selectChargeEvents(
  events: PersonEventAppearance[],
): PersonEventAppearance[] {
  return events.filter((e) => CHARGE_EVENT_TYPES.has(e.event_type));
}
