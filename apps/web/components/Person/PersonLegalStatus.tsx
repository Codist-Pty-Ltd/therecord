import Link from "next/link";

import EventTypeBadge from "@/components/ui/EventTypeBadge";
import { formatLongDate } from "@/lib/commissions";
import { selectChargeEvents } from "@/lib/person";

import type {
  PersonEventAppearance,
  PersonStoryAppearance,
} from "@the-record/shared-types";

interface PersonLegalStatusProps {
  personName: string;
  events: PersonEventAppearance[];
  stories: PersonStoryAppearance[];
}

/**
 * Legal-status panel. Renders ONLY when the person has charge-related events
 * (`charge_filed` or `arrest`) in their story sphere.
 *
 * The panel always carries a constitutional disclaimer — a "charged" status
 * is procedural, not a finding of fact. Section 35(3)(h) of the
 * Constitution guarantees the presumption of innocence, and The Record
 * surfaces that guarantee directly on the profile so no reader walks away
 * with the wrong impression.
 */
export default function PersonLegalStatus({
  personName,
  events,
  stories,
}: PersonLegalStatusProps) {
  const chargeEvents = selectChargeEvents(events);
  if (chargeEvents.length === 0) return null;

  const storyById = new Map(stories.map((s) => [s.id, s]));

  /* Newest charge events first — the reader wants the current status at a
   * glance, not a historical trail. */
  const ordered = [...chargeEvents].sort((a, b) =>
    b.event_date.localeCompare(a.event_date),
  );

  return (
    <section
      aria-label="Legal status"
      className="py-8 md:py-12"
    >
      <div className="bg-charge-red/[0.04] border border-charge-red/20 rounded-2xl p-5 md:p-7 lg:p-8 flex flex-col gap-5 md:gap-6">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="inline-flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full bg-charge-red text-white text-lg md:text-xl leading-none"
          >
            !
          </span>
          <div className="flex flex-col">
            <p className="label-smallcaps text-charge-red">Current legal status</p>
            <p className="font-serif text-xl md:text-2xl text-charcoal leading-tight">
              {personName} has {chargeEvents.length}{" "}
              {chargeEvents.length === 1 ? "charge-related event" : "charge-related events"}{" "}
              on record
            </p>
          </div>
        </div>

        <ul className="flex flex-col gap-3 md:gap-4">
          {ordered.map((event) => {
            const story = storyById.get(event.story_id) ?? null;
            return (
              <li
                key={event.id}
                className="bg-cream rounded-xl border border-charge-red/15 p-4 md:p-5 flex flex-col gap-2"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <EventTypeBadge type={event.event_type} />
                  <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-charcoal/45">
                    {formatLongDate(event.event_date)}
                  </span>
                </div>
                <p className="font-serif text-base md:text-lg leading-snug text-charcoal">
                  {event.title}
                </p>
                {story ? (
                  <Link
                    href={`/story/${story.slug}`}
                    className="inline-flex items-center gap-1.5 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-charge-red hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-charge-red/40 rounded-sm"
                  >
                    <span aria-hidden>↳</span>
                    In story: {story.title}
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>

        <div className="pt-4 md:pt-5 border-t border-charge-red/15">
          <p className="label-smallcaps text-charcoal/55 mb-2">
            Constitutional reminder · s35(3)(h)
          </p>
          <p className="font-serif text-[17px] md:text-xl leading-snug text-charcoal max-w-2xl">
            Charged does not mean convicted. Every person is presumed innocent
            until proven guilty in court.
          </p>
          <p className="mt-2 font-sans text-sm text-charcoal/60 max-w-2xl">
            This panel lists procedural events — an arrest or charge is a
            step in the criminal justice process, not a verdict.
          </p>
        </div>
      </div>
    </section>
  );
}
