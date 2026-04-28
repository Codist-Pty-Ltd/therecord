import Link from "next/link";

import StatusBadge, {
  type StatusBadgeVariant,
} from "@/components/ui/StatusBadge";
import { getPersonInitials, getStatusColour } from "@/lib/format";

import type { Person, PersonStatus } from "@the-record/shared-types";

export interface PersonRowProps {
  person: Person;
}

function personStatusToBadgeVariant(status: PersonStatus): StatusBadgeVariant {
  switch (status) {
    case "active":
    case "suspended":
    case "charged":
    case "acquitted":
    case "resigned":
    case "unknown":
      return status;
    default:
      return "unknown";
  }
}

export default function PersonRow({ person }: PersonRowProps) {
  const count = person.commission_count ?? 0;
  const initialColour = getStatusColour(person.status);
  const textOnAvatar =
    person.status === "suspended" || person.status === "acquitted"
      ? "text-charcoal"
      : "text-cream";

  return (
    <Link
      href={`/person/${person.id}`}
      className="group block rounded-md border border-transparent p-3 transition hover:bg-amber/[0.04] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/40"
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-medium ${textOnAvatar}`}
          style={{ backgroundColor: initialColour }}
          aria-hidden
        >
          {getPersonInitials(person.full_name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-serif text-[17px] leading-tight text-charcoal pr-1">
              {person.full_name}
            </h2>
            <span
              className="shrink-0 text-charcoal/30 transition group-hover:text-amber"
              aria-hidden
            >
              →
            </span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-[13px] text-charcoal/60">
            {person.current_role ?? person.organisation ?? "—"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={personStatusToBadgeVariant(person.status)} />
            {count > 0 ? (
              <span className="inline-flex font-mono text-[9px] uppercase tracking-wider text-charcoal/55 border border-charcoal/12 rounded px-1.5 py-0.5">
                {count} {count === 1 ? "commission" : "commissions"}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
