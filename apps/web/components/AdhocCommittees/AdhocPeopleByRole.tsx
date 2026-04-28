/**
 * People on an ad hoc committee, grouped by role (same interaction model as
 * commission detail). Horizontal scroll on mobile.
 */

import Link from "next/link";

import type {
  AdhocCommitteePeopleByRole,
  AdhocCommitteePersonBrief,
  AdhocCommitteePersonRole,
} from "@the-record/shared-types";

import {
  ADHOC_DETAIL_ROLE_HEADING,
  ADHOC_DETAIL_ROLE_ORDER,
} from "@/lib/adhoc-detail";

interface AdhocPeopleByRoleProps {
  people: AdhocCommitteePeopleByRole;
}

export default function AdhocPeopleByRole({ people }: AdhocPeopleByRoleProps) {
  const total = ADHOC_DETAIL_ROLE_ORDER.reduce(
    (n, role) => n + (people[role]?.length ?? 0),
    0,
  );
  if (total === 0) return null;

  return (
    <section
      aria-label="People"
      className="border-y border-charcoal/10 py-6 md:py-10 flex flex-col gap-7 md:gap-10"
    >
      <div className="flex items-center justify-between">
        <h2 className="label-smallcaps text-charcoal/55">People</h2>
        <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-charcoal/40">
          {total} {total === 1 ? "figure" : "figures"}
        </span>
      </div>

      {ADHOC_DETAIL_ROLE_ORDER.map((role) => {
        const group = people[role];
        if (!group || group.length === 0) return null;
        return <RoleGroup key={role} role={role} people={group} />;
      })}
    </section>
  );
}

function RoleGroup({
  role,
  people,
}: {
  role: AdhocCommitteePersonRole;
  people: AdhocCommitteePersonBrief[];
}) {
  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <div className="flex items-baseline gap-3">
        <h3 className="label-smallcaps text-amber">
          {ADHOC_DETAIL_ROLE_HEADING[role]}
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

function PersonCard({
  person,
  role,
}: {
  person: AdhocCommitteePersonBrief;
  role: AdhocCommitteePersonRole;
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
          {person.party_affiliation ? (
            <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.16em] text-charcoal/55 truncate">
              {person.party_affiliation}
            </span>
          ) : null}
          {person.summary ? (
            <span className="font-sans text-[11px] md:text-xs text-charcoal/45 line-clamp-2">
              {person.summary}
            </span>
          ) : null}
        </div>
      </Link>
    </li>
  );
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

function getRoleBgClass(role: AdhocCommitteePersonRole): string {
  switch (role) {
    case "chair":
      return "bg-legal-blue";
    case "member":
    case "secretary":
    case "legal_rep":
      return "bg-charcoal";
    case "implicated":
      return "bg-charge-red";
    case "witness":
      return "bg-timeline-green";
    default:
      return "bg-charcoal/60";
  }
}
