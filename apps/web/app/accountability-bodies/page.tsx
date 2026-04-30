import type { Metadata } from "next";
import Link from "next/link";

import {
  bodyStatusChipClasses,
  convictionRateDisplay,
  editorialCompareColumn,
  formatBodyYearsActive,
  sortBodiesForAccountabilityIndex,
  toneTextClass,
} from "@/lib/accountability-bodies-display";
import {
  compareAccountabilityBodies,
  listAccountabilityBodies,
} from "@/lib/api";

import type { AccountabilityBodyCompareRow } from "@the-record/shared-types";

export const dynamic = "force-dynamic";

const COMPARE_SLUGS = "scorpions-dso,hawks-dpci,idac";

export const metadata: Metadata = {
  title: "Accountability Bodies — The Record",
  description:
    "The specialised investigative units that have fought — and sometimes been prevented from fighting — corruption in South Africa.",
};

function Check({ ok }: { ok: boolean }) {
  return (
    <span className={ok ? "text-timeline-green font-semibold" : "text-charge-red"}>
      {ok ? "✓" : "✗"}
    </span>
  );
}

function ConvictionCell({
  slug,
  api,
}: {
  slug: string;
  api: AccountabilityBodyCompareRow | undefined;
}) {
  const ed = editorialCompareColumn(slug, api);
  if (ed.convictionBar === "full-green") {
    return (
      <div>
        <p className="text-sm font-medium text-timeline-green mb-2">{ed.convictionLabel}</p>
        <div className="h-2.5 w-full max-w-[140px] rounded bg-charcoal/10 overflow-hidden">
          <div className="h-full w-full bg-timeline-green rounded-r" />
        </div>
      </div>
    );
  }
  if (ed.convictionBar === "partial-amber") {
    return (
      <div>
        <p className="text-sm font-medium text-amber mb-2">{ed.convictionLabel}</p>
        <div className="h-2.5 w-full max-w-[140px] rounded bg-charcoal/10 overflow-hidden">
          <div className="h-full w-[55%] bg-amber rounded-r" />
        </div>
      </div>
    );
  }
  return (
    <p className="text-sm text-charcoal/55 italic">
      {ed.convictionLabel === "Too new" ? "Insufficient data" : ed.convictionLabel}
    </p>
  );
}

export default async function AccountabilityBodiesIndexPage() {
  const [rawBodies, compare] = await Promise.all([
    listAccountabilityBodies(),
    compareAccountabilityBodies(COMPARE_SLUGS),
  ]);

  const bodies = sortBodiesForAccountabilityIndex(rawBodies);
  const slugList = COMPARE_SLUGS.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const compareCols =
    compare?.bodies.map((row, i) => ({
      slug: slugList[i] ?? "",
      row,
    })) ?? [];

  return (
    <div className="bg-cream min-w-0">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-14">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-charcoal/45">
          Special Units · Past &amp; Present
        </p>
        <h1 className="mt-3 font-serif text-3xl md:text-[40px] text-charcoal tracking-tight">
          Accountability Bodies
        </h1>
        <p className="mt-5 max-w-2xl text-base md:text-lg leading-relaxed text-charcoal/75">
          The specialised investigative units that have fought — and sometimes been prevented
          from fighting — corruption in South Africa.
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bodies.map((b) => {
            const st = bodyStatusChipClasses(b.status);
            const rate = convictionRateDisplay(b.conviction_rate_percentage);
            const years = formatBodyYearsActive(b);
            const keyStat =
              b.total_convictions != null
                ? `${b.total_convictions.toLocaleString("en-ZA")} convictions`
                : b.status === "disbanded"
                  ? "Disbanded — see dossier"
                  : "Active unit";

            return (
              <Link
                key={b.id}
                href={`/accountability-bodies/${b.slug}`}
                className="group block rounded-2xl border border-charcoal/10 bg-charcoal/[0.92] text-cream p-5 transition hover:border-amber/35"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={[
                      "inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider",
                      st.wrap,
                    ].join(" ")}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                    {st.label}
                  </span>
                </div>
                <h2 className="mt-4 font-serif text-[18px] leading-snug text-cream group-hover:text-amber transition-colors">
                  {b.popular_name}
                </h2>
                <span className="mt-2 inline-block rounded border border-amber/40 bg-amber/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber">
                  {b.abbreviation}
                </span>
                {b.parent_organisation ? (
                  <p className="mt-3 font-mono text-[11px] text-cream/50 leading-snug">
                    {b.parent_organisation}
                  </p>
                ) : null}
                <p className="mt-2 font-mono text-[11px] text-cream/45">{years}</p>
                {rate ? (
                  <p className="mt-4 font-serif text-3xl text-amber tabular-nums">{rate}</p>
                ) : (
                  <p className="mt-4 font-serif text-xl text-cream/50">—</p>
                )}
                <p className="mt-1 text-sm text-cream/65 line-clamp-2">{keyStat}</p>
                <p className="mt-5 font-mono text-[12px] text-amber/90 group-hover:text-amber">
                  View full record →
                </p>
              </Link>
            );
          })}
        </div>

        <section className="mt-16 md:mt-20 border-t border-charcoal/10 pt-12 md:pt-14">
          <h2 className="font-serif text-2xl text-charcoal tracking-tight">How they compare</h2>
          <p className="mt-2 text-sm text-charcoal/60 max-w-2xl">
            A side-by-side read of the three units most often named together in South Africa’s
            anti-corruption story — including powers, politics, and conviction signals.
          </p>

          {compareCols.length === 0 ? (
            <p className="mt-6 text-sm text-charcoal/55">
              Comparison data is unavailable right now (API offline or bodies missing from the database).
            </p>
          ) : (
          <div className="mt-8 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-thin">
            <table className="min-w-[720px] w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-charcoal/15">
                  <th className="py-3 pr-4 font-mono text-[10px] uppercase tracking-wider text-charcoal/45 w-36" />
                  {compareCols.map(({ slug, row }) => (
                    <th key={slug || row.abbreviation} className="py-3 px-3 font-serif text-base text-charcoal">
                      {row.abbreviation}
                      <span className="block font-sans text-[11px] font-normal text-charcoal/50 mt-0.5">
                        {row.name}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="align-top">
                <tr className="border-b border-charcoal/10">
                  <th className="py-3 pr-4 font-mono text-[10px] uppercase tracking-wider text-charcoal/50">
                    Parent
                  </th>
                  {compareCols.map(({ slug, row }) => (
                    <td key={`p-${slug}`} className="py-3 px-3 text-charcoal/85">
                      {row.parent_organisation ?? "—"}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-charcoal/10">
                  <th className="py-3 pr-4 font-mono text-[10px] uppercase tracking-wider text-charcoal/50">
                    Can arrest?
                  </th>
                  {compareCols.map(({ slug, row }) => {
                    const ed = editorialCompareColumn(slug, row);
                    return (
                      <td key={`a-${slug}`} className="py-3 px-3">
                        <Check ok={ed.canArrest} />
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b border-charcoal/10">
                  <th className="py-3 pr-4 font-mono text-[10px] uppercase tracking-wider text-charcoal/50">
                    Can prosecute?
                  </th>
                  {compareCols.map(({ slug, row }) => {
                    const ed = editorialCompareColumn(slug, row);
                    return (
                      <td key={`pr-${slug}`} className="py-3 px-3">
                        <Check ok={ed.canProsecute} />
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b border-charcoal/10 bg-amber/[0.04]">
                  <th className="py-3 pr-4 font-mono text-[10px] uppercase tracking-wider text-charcoal/50">
                    Conviction rate
                  </th>
                  {compareCols.map(({ slug, row }) => (
                    <td key={`c-${slug}`} className="py-3 px-3">
                      <ConvictionCell slug={slug} api={row} />
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-charcoal/10">
                  <th className="py-3 pr-4 font-mono text-[10px] uppercase tracking-wider text-charcoal/50">
                    Years active
                  </th>
                  {compareCols.map(({ slug, row }) => {
                    const ed = editorialCompareColumn(slug, row);
                    return (
                      <td key={`y-${slug}`} className="py-3 px-3 text-charcoal/85">
                        {ed.yearsLabelOverride ?? "—"}
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b border-charcoal/10">
                  <th className="py-3 pr-4 font-mono text-[10px] uppercase tracking-wider text-charcoal/50">
                    Independence
                  </th>
                  {compareCols.map(({ slug, row }) => {
                    const ed = editorialCompareColumn(slug, row);
                    return (
                      <td
                        key={`i-${slug}`}
                        className={["py-3 px-3 font-medium", toneTextClass(ed.independenceTone)].join(" ")}
                      >
                        {ed.independence}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <th className="py-3 pr-4 font-mono text-[10px] uppercase tracking-wider text-charcoal/50">
                    Politically disbanded?
                  </th>
                  {compareCols.map(({ slug, row }) => (
                    <td
                      key={`pol-${slug}`}
                      className={`py-3 px-3 ${row.was_political_disbanding === true ? "text-charge-red font-medium" : "text-timeline-green"}`}
                    >
                      {row.was_political_disbanding === true ? "Yes" : "No"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          )}
        </section>
      </div>
    </div>
  );
}
