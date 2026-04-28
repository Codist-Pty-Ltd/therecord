import type {
  LegalReference,
  TimelineEventWithReferences,
} from "@the-record/shared-types";

import PlainEnglishBox from "@/components/ui/PlainEnglishBox";

interface LegalFrameworkProps {
  events: TimelineEventWithReferences[];
  /** Domain of the story — used to colour the editorial plain-English copy. */
  // reserved for future per-domain copy variations
}

/**
 * The body of legal references for a story, grouped by act.
 *
 * Layout strategy: duplicate DOM — a mobile `<details>` (native collapsible)
 * and a desktop always-expanded section, mutually hidden via Tailwind. This
 * keeps the component a pure Server Component (no client JS, no hydration
 * flash) while meeting the "collapsed accordion on mobile / sidebar on
 * desktop" spec.
 */
export default function LegalFramework({ events }: LegalFrameworkProps) {
  const { statutory, constitutional } = aggregateReferences(events);

  if (statutory.length === 0 && constitutional.length === 0) return null;

  const statutoryGroups = groupByAct(statutory);
  const totalRefs = statutory.length + constitutional.length;

  const content = (
    <LegalContent
      statutoryGroups={statutoryGroups}
      constitutional={constitutional}
    />
  );

  return (
    <section aria-label="Legal framework">
      {/* Mobile — collapsible accordion */}
      <details className="group lg:hidden border-y border-charcoal/10 py-1">
        <summary className="list-none cursor-pointer select-none flex items-center justify-between gap-3 py-4 md:py-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/40 rounded">
          <div className="flex flex-col">
            <h2 className="label-smallcaps text-charcoal/55">
              Legal framework
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-charcoal/40 mt-1">
              {totalRefs} {totalRefs === 1 ? "provision" : "provisions"}
            </span>
          </div>
          <span
            aria-hidden
            className="w-9 h-9 rounded-full border border-charcoal/15 flex items-center justify-center text-charcoal/60 text-base transition-transform group-open:rotate-45"
          >
            +
          </span>
        </summary>

        <div className="pt-2 pb-6">{content}</div>
      </details>

      {/* Desktop — always expanded, no toggle affordance */}
      <div className="hidden lg:flex lg:flex-col">
        <div className="flex items-baseline justify-between mb-5 pb-3 border-b border-charcoal/10">
          <h2 className="label-smallcaps text-charcoal/55">Legal framework</h2>
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-charcoal/40">
            {totalRefs} {totalRefs === 1 ? "provision" : "provisions"}
          </span>
        </div>
        {content}
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Content body (shared between mobile & desktop renders)
// -----------------------------------------------------------------------------

interface LegalContentProps {
  statutoryGroups: ActGroup[];
  constitutional: LegalReference[];
}

function LegalContent({ statutoryGroups, constitutional }: LegalContentProps) {
  return (
    <div className="flex flex-col gap-6 md:gap-7">
      {statutoryGroups.length > 0 ? (
        <div className="flex flex-col gap-4 md:gap-5">
          <h3 className="label-smallcaps text-legal-blue">
            Statutory references
          </h3>
          <ul className="flex flex-col gap-4 md:gap-5">
            {statutoryGroups.map((group) => (
              <ActGroupCard key={group.key} group={group} />
            ))}
          </ul>
        </div>
      ) : null}

      {constitutional.length > 0 ? (
        <div className="flex flex-col gap-4 md:gap-5">
          <h3 className="label-smallcaps text-constitutional-gold">
            Constitution
          </h3>
          <ul className="flex flex-col gap-3">
            {constitutional.map((reference, idx) => (
              <ConstitutionRow
                key={`${reference.act_name}-${reference.section}-${idx}`}
                reference={reference}
              />
            ))}
          </ul>
        </div>
      ) : null}

      <div className="pt-2 md:pt-3 border-t border-charcoal/10">
        <h3 className="label-smallcaps text-charcoal/55 mb-3">
          What does this mean for ordinary people?
        </h3>
        <PlainEnglishBox
          level="layperson"
          defaultOpen
          text={buildPlainEnglishSummary(statutoryGroups, constitutional)}
        />
      </div>
    </div>
  );
}

function ActGroupCard({ group }: { group: ActGroup }) {
  return (
    <li className="border-l-4 border-legal-blue bg-white rounded-r-xl px-4 md:px-5 py-4 md:py-5 shadow-[0_1px_3px_rgba(28,28,30,0.04)]">
      <div className="flex flex-col gap-1 mb-3">
        <h4 className="font-mono text-[11px] md:text-xs uppercase tracking-[0.18em] text-legal-blue">
          {group.short_name || group.act_name}
        </h4>
        <p className="font-serif text-[15px] md:text-base text-charcoal leading-tight">
          {group.act_name}
          {group.act_number ? (
            <span className="font-mono text-[11px] text-charcoal/50 ml-1.5">
              · Act {group.act_number}
            </span>
          ) : null}
        </p>
      </div>

      <ul className="flex flex-col gap-3 border-t border-charcoal/5 pt-3">
        {group.refs.map((ref, idx) => (
          <li key={`${ref.section}-${idx}`} className="flex flex-col gap-1.5">
            <p className="font-mono text-[11px] md:text-xs uppercase tracking-[0.14em] text-charcoal/60">
              Section {ref.section}
            </p>
            <p className="font-sans text-[13px] md:text-sm leading-relaxed text-charcoal/80">
              {ref.relevance}
            </p>
            {ref.plain_english ? (
              <p className="font-serif text-[13px] md:text-sm italic leading-relaxed text-charcoal/70 bg-cream rounded-md px-3 py-2 mt-1">
                {ref.plain_english}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </li>
  );
}

function ConstitutionRow({ reference }: { reference: LegalReference }) {
  return (
    <li className="border-l-4 border-constitutional-gold bg-white rounded-r-xl px-4 md:px-5 py-3 md:py-4 shadow-[0_1px_3px_rgba(28,28,30,0.04)]">
      <p className="font-mono text-[11px] md:text-xs uppercase tracking-[0.14em] text-constitutional-gold mb-1.5">
        § Section {reference.section}
      </p>
      <p className="font-sans text-[13px] md:text-sm leading-relaxed text-charcoal/80">
        {reference.relevance}
      </p>
      {reference.plain_english ? (
        <p className="font-serif text-[13px] md:text-sm italic leading-relaxed text-charcoal/70 bg-cream rounded-md px-3 py-2 mt-2">
          {reference.plain_english}
        </p>
      ) : null}
    </li>
  );
}

// -----------------------------------------------------------------------------
// Aggregation
// -----------------------------------------------------------------------------

interface ActGroup {
  key: string;
  act_name: string;
  short_name: string;
  act_number: string | null;
  refs: LegalReference[];
}

function aggregateReferences(events: TimelineEventWithReferences[]): {
  statutory: LegalReference[];
  constitutional: LegalReference[];
} {
  const seen = new Map<string, LegalReference>();
  for (const event of events) {
    for (const ref of event.legal_references ?? []) {
      const key = refKey(ref);
      if (!seen.has(key)) seen.set(key, ref);
    }
  }
  const all = Array.from(seen.values());
  return {
    statutory: all.filter((r) => !r.is_constitutional),
    constitutional: all.filter((r) => r.is_constitutional),
  };
}

function refKey(ref: LegalReference): string {
  return `${ref.is_constitutional ? "c" : "s"}|${ref.act_name}|${ref.section}`;
}

function groupByAct(refs: LegalReference[]): ActGroup[] {
  const groups = new Map<string, ActGroup>();
  for (const ref of refs) {
    const key = `${ref.act_name}|${ref.act_number ?? ""}`;
    const existing = groups.get(key);
    if (existing) {
      existing.refs.push(ref);
    } else {
      groups.set(key, {
        key,
        act_name: ref.act_name,
        short_name: ref.short_name,
        act_number: ref.act_number ?? null,
        refs: [ref],
      });
    }
  }
  return Array.from(groups.values());
}

/**
 * Editorial fallback copy. Pitched at a "citizen with no legal background"
 * level (hence `level="layperson"` on the PlainEnglishBox above). Tries to
 * summarise the stakes rather than enumerate the references.
 */
function buildPlainEnglishSummary(
  statutoryGroups: ActGroup[],
  constitutional: LegalReference[],
): string {
  const actCount = statutoryGroups.length;
  const constCount = constitutional.length;

  const parts: string[] = [];

  if (actCount > 0 && constCount > 0) {
    parts.push(
      `This story touches ${actCount} Act${actCount === 1 ? "" : "s"} of Parliament and ${constCount} provision${constCount === 1 ? "" : "s"} of the Constitution.`,
    );
  } else if (actCount > 0) {
    parts.push(
      `This story touches ${actCount} Act${actCount === 1 ? "" : "s"} of Parliament.`,
    );
  } else if (constCount > 0) {
    parts.push(
      `This story engages ${constCount} provision${constCount === 1 ? "" : "s"} of the Constitution directly.`,
    );
  }

  parts.push(
    "These are the rules that were supposed to be followed — by police, prosecutors, ministers, and civil servants. When those rules aren't followed, ordinary people pay the price: crimes go uninvestigated, public money goes missing, and trust breaks down. The Record tracks every step so accountability has a paper trail.",
  );

  return parts.join(" ");
}
