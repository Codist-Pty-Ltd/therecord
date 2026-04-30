import type {
  ExpenditureSector,
  ExpenditureType,
  ProvinceDetail,
  ProvinceMoneySummary,
} from "@the-record/shared-types";

import { expenditureSectorLabel, expenditureTypeLabel } from "@/lib/expenditure-ui";
import { formatRands } from "@/lib/format";

interface ProvinceMoneyPanelProps {
  provinceName: string;
  totalTrackedRands: number;
  money: ProvinceMoneySummary | null;
  /** Top sectors from province detail (numeric breakdown). */
  sectorRows: ProvinceDetail["expenditure_by_sector"];
}

const PRIORITY_SECTORS = new Set([
  "housing",
  "water_sanitation",
  "construction_roads",
]);

export default function ProvinceMoneyPanel({
  provinceName,
  totalTrackedRands,
  money,
  sectorRows,
}: ProvinceMoneyPanelProps) {
  const typeLine = money
    ? [
        { label: "Under investigation", value: money.total_under_investigation },
        { label: "Allegedly stolen", value: money.total_allegedly_stolen },
        { label: "Recovered", value: money.total_recovered },
      ]
    : [];

  const sectorsFromDetail = [...sectorRows]
    .filter((r) => r.total_rands > 0)
    .sort((a, b) => {
      const pa = PRIORITY_SECTORS.has(a.sector) ? 0 : 1;
      const pb = PRIORITY_SECTORS.has(b.sector) ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return b.total_rands - a.total_rands;
    })
    .slice(0, 6);

  return (
    <section
      aria-label={`Money tracked in ${provinceName}`}
      className="rounded-3xl border border-amber/35 bg-gradient-to-br from-amber/25 via-amber/15 to-cream px-6 py-7 md:px-10 md:py-9 text-charcoal shadow-[inset_0_1px_0_rgba(200,101,27,0.12)]"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-charcoal/55">
        Money tracked
      </p>
      <p className="mt-2 font-serif text-4xl md:text-[44px] leading-none tracking-tight text-amber">
        {formatRands(totalTrackedRands)}
      </p>
      <p className="mt-2 text-sm text-charcoal/70">
        Expenditure attributed to stories in {provinceName}.
      </p>

      {typeLine.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 border-t border-charcoal/10 pt-5">
          {typeLine.map((row) => (
            <div key={row.label} className="min-w-[120px]">
              <p className="font-mono text-[9px] uppercase tracking-wider text-charcoal/45">
                {row.label}
              </p>
              <p className="font-mono text-sm text-charcoal tabular-nums">
                {formatRands(row.value)}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {sectorsFromDetail.length > 0 ? (
        <div className="mt-6 border-t border-charcoal/10 pt-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-charcoal/45 mb-3">
            By sector
          </p>
          <div className="flex flex-wrap gap-2">
            {sectorsFromDetail.map((s) => (
              <span
                key={s.sector}
                className="inline-flex items-baseline gap-1.5 rounded-full border border-charcoal/12 bg-cream/80 px-3 py-1.5 font-mono text-[11px] text-charcoal/80 tabular-nums"
              >
                <span>{expenditureSectorLabel(s.sector)}:</span>
                <span className="text-amber">{formatRands(s.total_rands)}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

/** Municipality variant — uses API breakdown fields. */
export function MunicipalityMoneyPanel({
  name,
  totalRands,
  expenditure_by_type,
  expenditure_by_sector,
}: {
  name: string;
  totalRands: number;
  expenditure_by_type: { expenditure_type: string; total_rands: number }[];
  expenditure_by_sector: { sector: string; amount: number }[];
}) {
  const types = expenditure_by_type.filter((t) => t.total_rands > 0).slice(0, 4);
  const sectors = expenditure_by_sector.filter((s) => s.amount > 0).slice(0, 6);

  return (
    <section
      className="rounded-3xl border border-amber/35 bg-gradient-to-br from-amber/25 via-amber/15 to-cream px-6 py-7 md:px-9 md:py-8 text-charcoal"
      aria-label={`Money tracked in ${name}`}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-charcoal/55">
        Money tracked
      </p>
      <p className="mt-2 font-serif text-3xl md:text-4xl leading-none text-amber">
        {formatRands(totalRands)}
      </p>
      {types.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-3 border-t border-charcoal/10 pt-4">
          {types.map((t) => (
            <div key={t.expenditure_type} className="min-w-[100px]">
              <p className="font-mono text-[9px] uppercase tracking-wider text-charcoal/45">
                {expenditureTypeLabel(t.expenditure_type as ExpenditureType)}
              </p>
              <p className="font-mono text-sm tabular-nums">{formatRands(t.total_rands)}</p>
            </div>
          ))}
        </div>
      ) : null}
      {sectors.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-charcoal/10 pt-4">
          {sectors.map((s) => (
            <span
              key={s.sector}
              className="inline-flex gap-1.5 rounded-full border border-charcoal/12 bg-cream/80 px-3 py-1.5 font-mono text-[11px] tabular-nums text-charcoal/80"
            >
              {expenditureSectorLabel(s.sector as ExpenditureSector)}:
              <span className="text-amber">{formatRands(s.amount)}</span>
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
