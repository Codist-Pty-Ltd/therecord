/**
 * CommissionPeopleByRole — the Key People section of a commission's detail
 * page. Groups people by their CommissionPersonRole (chair, evidence
 * leaders, witnesses, implicated…) using the display order defined in
 * `lib/commissions.ts`.
 *
 * Each group is a horizontal scrolling strip on mobile (matches the story
 * page's KeyPeopleStrip) and wraps to multiple rows on desktop.
 *
 * Server Component.
 */

import Link from "next/link";

import type {
  CommissionPersonBrief,
  CommissionPersonRole,
} from "@the-record/shared-types";

import {
  COMMISSION_PERSON_ROLE_LABELS,
  COMMISSION_PERSON_ROLE_ORDER,
} from "@/lib/commissions";

interface CommissionPeopleByRoleProps {
  people: CommissionPersonBrief[];
}

export default function CommissionPeopleByRole({
  people,
}: CommissionPeopleByRoleProps) {
  if (people.length === 0) return null;

  const grouped = groupByRole(people);

  return (
    <section
      aria-label="Key people"
      className="border-y border-charcoal/10 py-6 md:py-10 flex flex-col gap-7 md:gap-10"
    >
      <div className="flex items-center justify-between">
        <h2 className="label-smallcaps text-charcoal/55">Key people</h2>
        <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-charcoal/40">
          {people.length} {people.length === 1 ? "figure" : "figures"}
        </span>
      </div>

      {COMMISSION_PERSON_ROLE_ORDER.map((role) => {
        const group = grouped.get(role);
        if (!group || group.length === 0) return null;
        return <RoleGroup key={role} role={role} people={group} />;
      })}
    </section>
  );
}

// =============================================================================
// Role group
// =============================================================================

function RoleGroup({
  role,
  people,
}: {
  role: CommissionPersonRole;
  people: CommissionPersonBrief[];
}) {
  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <div className="flex items-baseline gap-3">
        <h3 className="label-smallcaps text-amber">
          {COMMISSION_PERSON_ROLE_LABELS[role]}
        </h3>
        <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-charcoal/40">
          {people.length}
        </span>
      </div>

      <div className="-mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto scrollbar-hidden lg:overflow-visible">
        <ul className="flex flex-nowrap lg:flex-wrap gap-3 md:gap-4 lg:gap-5 pb-2 lg:pb-0">
          {people.map((p) => (
            <PersonCard key={p.id} person={p} role={role} />
          ))}
        </ul>
      </div>
    </div>
  );
}

// =============================================================================
// Person card
// =============================================================================

function PersonCard({
  person,
  role,
}: {
  person: CommissionPersonBrief;
  role: CommissionPersonRole;
}) {
  const initials = getInitials(person.full_name);
  const bg = getRoleBgClass(role);

  return (
    <li className="shrink-0 w-[148px] md:w-[168px] lg:w-auto">
      <Link
        href={`/person/${person.person_id}`}
        className="group flex flex-col items-center text-center gap-2.5 md:gap-3 p-2 -m-2 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/40 transition-colors"
      >
        <span
          aria-hidden
          className={[
            "relative flex items-center justify-center",
            "w-16 h-16 md:w-[72px] md:h-[72px] rounded-full",
            "text-white font-serif text-[20px] md:text-2xl leading-none",
            "shadow-[0_2px_6px_rgba(28,28,30,0.12)]",
            "ring-[3px] ring-cream",
            "transition-all duration-200",
            "group-hover:shadow-[0_6px_18px_rgba(28,28,30,0.16)] group-hover:-translate-y-0.5",
            bg,
          ].join(" ")}
        >
          {initials}
        </span>

        <div className="flex flex-col gap-0.5 min-w-0 w-full">
          <span className="font-serif text-[15px] md:text-base leading-[1.2] text-charcoal truncate">
            {person.full_name}
          </span>
          {person.current_role ? (
            <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.16em] text-charcoal/55 truncate">
              {person.current_role}
            </span>
          ) : null}
          {person.organisation ? (
            <span className="font-sans text-[11px] md:text-xs text-charcoal/45 truncate">
              {person.organisation}
            </span>
          ) : null}
        </div>
      </Link>
    </li>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function groupByRole(
  people: CommissionPersonBrief[],
): Map<CommissionPersonRole, CommissionPersonBrief[]> {
  const map = new Map<CommissionPersonRole, CommissionPersonBrief[]>();
  for (const p of people) {
    const bucket = map.get(p.role);
    if (bucket) bucket.push(p);
    else map.set(p.role, [p]);
  }
  return map;
}

function getInitials(fullName: string): string {
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

/**
 * Colour-code the avatar by the person's role at THIS commission (not their
 * real-world job), so readers can scan the group and immediately see who's a
 * chair, who's implicated, who's a witness.
 */
function getRoleBgClass(role: CommissionPersonRole): string {
  switch (role) {
    case "chair":
    case "commissioner":
      return "bg-legal-blue";
    case "evidence_leader":
    case "secretary":
    case "legal_rep":
      return "bg-charcoal";
    case "implicated":
    case "subject_of_inquiry":
      return "bg-charge-red";
    case "witness":
      return "bg-timeline-green";
    case "established_by":
      return "bg-constitutional-gold";
    default:
      return "bg-charcoal/60";
  }
}
