import Link from "next/link";

import type { StoryPersonWithPerson } from "@the-record/shared-types";

interface KeyPeopleStripProps {
  people: StoryPersonWithPerson[];
}

/**
 * Horizontal strip of people associated with a story.
 * - Mobile: horizontal scroll, no visible scrollbar.
 * - Desktop (lg): wraps to multiple rows.
 * Key figures (`is_key_figure=true`) are always rendered first.
 */
export default function KeyPeopleStrip({ people }: KeyPeopleStripProps) {
  if (people.length === 0) return null;

  const ordered = [...people].sort((a, b) => {
    if (a.is_key_figure === b.is_key_figure) return 0;
    return a.is_key_figure ? -1 : 1;
  });

  return (
    <section
      aria-label="Key people"
      className="border-y border-charcoal/10 py-5 md:py-7"
    >
      <div className="flex items-center justify-between mb-4 md:mb-5">
        <h2 className="label-smallcaps text-charcoal/55">Key people</h2>
        <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-charcoal/40">
          {people.length} {people.length === 1 ? "figure" : "figures"}
        </span>
      </div>

      <div className="-mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto scrollbar-hidden lg:overflow-visible">
        <ul className="flex flex-nowrap lg:flex-wrap gap-3 md:gap-4 lg:gap-5 pb-2 lg:pb-0">
          {ordered.map((sp) => (
            <PersonCard key={sp.id} storyPerson={sp} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function PersonCard({ storyPerson }: { storyPerson: StoryPersonWithPerson }) {
  const { person, role_in_story, is_key_figure } = storyPerson;
  const bg = getRoleBgClass(role_in_story);
  const initials = getInitials(person.full_name);

  return (
    <li className="shrink-0 w-[148px] md:w-[168px] lg:w-auto">
      <Link
        href={`/person/${person.id}`}
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
          {is_key_figure ? (
            <span
              aria-hidden
              className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 rounded-full bg-amber text-white text-[10px] md:text-xs font-bold flex items-center justify-center shadow-sm border-2 border-cream"
            >
              ★
            </span>
          ) : null}
        </span>

        <div className="flex flex-col gap-0.5 min-w-0 w-full">
          <span className="font-serif text-[15px] md:text-base leading-[1.2] text-charcoal truncate">
            {person.full_name}
          </span>
          <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.16em] text-charcoal/55 truncate">
            {role_in_story}
          </span>
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

/** Reduce a full name to up to two initial characters. Handles unicode names. */
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
 * Maps a `role_in_story` string to a semantic colour class. The API stores
 * this as freeform varchar — we pattern-match on common legal-reporting
 * vocabulary rather than enforcing an enum.
 */
function getRoleBgClass(role: string): string {
  const r = role.toLowerCase();
  if (/(accused|charged|suspect|defendant)/.test(r)) return "bg-charge-red";
  if (/(whistleblower|informant|complainant)/.test(r)) return "bg-amber";
  if (/(judge|chair|justice|magistrate)/.test(r)) return "bg-legal-blue";
  if (/(witness|investigator)/.test(r)) return "bg-timeline-green";
  if (/(minister|president|premier|mec)/.test(r)) return "bg-constitutional-gold";
  return "bg-charcoal";
}
