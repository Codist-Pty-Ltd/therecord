import StatusBadge from "@/components/ui/StatusBadge";
import {
  getPersonInitials,
  personAvatarBgClass,
  personStatusToBadgeVariant,
} from "@/lib/person";

import type { PersonDetail } from "@the-record/shared-types";

interface PersonHeaderProps {
  person: PersonDetail;
}

/**
 * Person profile header. Server component. Mobile-first:
 *
 *  - the large initials circle is the focal point on mobile and shifts to
 *    the left of a two-column layout from md+ upwards,
 *  - status badge sits inline with the metadata row so it's still visible
 *    above the fold,
 *  - aliases line is rendered subtly in mono small-caps beneath the name
 *    because reporters frequently search by surname or nickname.
 */
export default function PersonHeader({ person }: PersonHeaderProps) {
  const initials = getPersonInitials(person.full_name);
  const avatarBg = personAvatarBgClass(person.status);
  const badgeVariant = personStatusToBadgeVariant(person.status);

  return (
    <header
      aria-label="Person profile header"
      className="flex flex-col md:flex-row md:items-start gap-5 md:gap-8 py-6 md:py-10 lg:py-12"
    >
      <span
        aria-hidden
        className={[
          "relative flex items-center justify-center shrink-0",
          "w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full",
          "text-white font-serif leading-none",
          "text-[30px] md:text-[40px] lg:text-[44px]",
          "shadow-[0_4px_16px_rgba(28,28,30,0.14)]",
          "ring-[4px] ring-cream",
          avatarBg,
        ].join(" ")}
      >
        {initials}
      </span>

      <div className="flex-1 min-w-0 flex flex-col gap-3 md:gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge status={badgeVariant} />
          {person.status === "resigned" || person.status === "unknown" ? (
            <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-charcoal/40">
              {person.status === "resigned" ? "Resigned" : "Status unknown"}
            </span>
          ) : null}
        </div>

        <h1
          className={[
            "font-serif text-charcoal leading-[1.05] tracking-[-0.01em]",
            "text-[28px] md:text-[40px] lg:text-[44px]",
          ].join(" ")}
        >
          {person.full_name}
        </h1>

        {person.aliases.length > 0 ? (
          <p className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-charcoal/45">
            {person.aliases.join("  ·  ")}
          </p>
        ) : null}

        {person.current_role || person.organisation ? (
          <p className="font-sans text-[15px] md:text-lg text-charcoal/75 leading-relaxed max-w-2xl">
            {person.current_role}
            {person.current_role && person.organisation ? (
              <span className="text-charcoal/40"> · </span>
            ) : null}
            {person.organisation}
          </p>
        ) : null}

        {person.profile_summary ? (
          <p className="font-sans text-[15px] md:text-base text-charcoal/70 leading-relaxed max-w-3xl">
            {person.profile_summary}
          </p>
        ) : null}
      </div>
    </header>
  );
}
