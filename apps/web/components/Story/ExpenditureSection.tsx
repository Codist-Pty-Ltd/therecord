import type { AmountQualifier, PublicExpenditureRecord } from "@the-record/shared-types";

import {
  expenditureTypeAmountClass,
  expenditureTypeLabel,
  expenditureSectorLabel,
} from "@/lib/expenditure-ui";
import { formatRands } from "@/lib/format";

function qualifierCopy(
  q: AmountQualifier,
  formattedAmount: string,
): string | null {
  switch (q) {
    case "exact":
      return null;
    case "approximate":
      return `Approximately ${formattedAmount} — exact figure not confirmed.`;
    case "under_investigation":
      return `${formattedAmount} is the total value under investigation, not the confirmed stolen amount.`;
    case "minimum":
      return `At least ${formattedAmount} — full amount may be higher.`;
    case "maximum":
      return `Up to ${formattedAmount} — the full scope may be lower.`;
    default:
      return null;
  }
}

function sumAmountRands(records: PublicExpenditureRecord[]): bigint {
  return records.reduce((acc, r) => {
    try {
      return acc + BigInt(r.amount_rands);
    } catch {
      return acc;
    }
  }, 0n);
}

function formatBigIntRands(n: bigint): string {
  if (n <= 0n) return "N/A";
  const num = Number(n);
  if (Number.isSafeInteger(num)) return formatRands(num);
  return formatRands(n.toString());
}

interface ExpenditureSectionProps {
  records: PublicExpenditureRecord[];
  storyTitle: string;
}

export default function ExpenditureSection({
  records,
  storyTitle,
}: ExpenditureSectionProps) {
  if (records.length === 0) {
    return null;
  }

  const total = sumAmountRands(records);
  const totalFormatted = formatBigIntRands(total);

  return (
    <section
      aria-label="Public money involved"
      className="mt-10 md:mt-12 border-t border-charcoal/10 pt-10 md:pt-12"
    >
      <h2 className="label-smallcaps text-charcoal/55 mb-5 md:mb-6">
        Public money involved
      </h2>
      <p className="sr-only">
        Expenditure figures linked to the story: {storyTitle}
      </p>

      {records.length === 1 ? (
        <SingleRecordPanel record={records[0]} />
      ) : (
        <ul className="flex flex-col gap-4">
          {records.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-charcoal/10 bg-cream/80 px-5 py-4 md:px-6 md:py-5"
            >
              <MultiRecordRow record={r} />
            </li>
          ))}
        </ul>
      )}

      {records.length > 1 ? (
        <p className="mt-6 font-mono text-sm text-charcoal/80 tabular-nums">
          Total tracked:{" "}
          <span className="font-serif text-lg text-amber">{totalFormatted}</span>
        </p>
      ) : null}
    </section>
  );
}

function SingleRecordPanel({ record }: { record: PublicExpenditureRecord }) {
  const formatted = formatRands(record.amount_rands);
  const disc = qualifierCopy(record.amount_qualifier, formatted);
  const typeClass = expenditureTypeAmountClass(record.expenditure_type);

  return (
    <div className="rounded-2xl border border-amber/25 bg-amber/[0.07] px-6 py-6 md:px-8 md:py-8">
      <p
        className={`font-serif text-[32px] md:text-[36px] leading-none tracking-tight ${typeClass}`}
      >
        {formatted}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex rounded-full border border-charcoal/15 bg-cream px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-charcoal/80">
          {expenditureTypeLabel(record.expenditure_type)}
        </span>
        <span className="inline-flex rounded-full border border-charcoal/15 bg-cream px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-charcoal/80">
          {expenditureSectorLabel(record.sector)}
        </span>
        {record.is_primary_record === false ? (
          <span className="inline-flex rounded-full border border-charcoal/20 bg-charcoal/[0.04] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-charcoal/55">
            Story context only — not in national total
          </span>
        ) : null}
      </div>
      {record.description ? (
        <p className="mt-4 text-sm leading-relaxed text-charcoal/75">
          {record.description}
        </p>
      ) : null}
      {record.plain_english ? (
        <p className="mt-2 text-sm italic text-charcoal/60">{record.plain_english}</p>
      ) : null}
      {disc ? (
        <p className="mt-4 border-l-2 border-amber/50 pl-3 text-xs text-charcoal/55">
          {disc}
        </p>
      ) : null}
    </div>
  );
}

function MultiRecordRow({ record }: { record: PublicExpenditureRecord }) {
  const formatted = formatRands(record.amount_rands);
  const disc = qualifierCopy(record.amount_qualifier, formatted);
  const typeClass = expenditureTypeAmountClass(record.expenditure_type);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className={`font-serif text-xl md:text-2xl ${typeClass}`}>{formatted}</span>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex rounded border border-charcoal/12 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-charcoal/70">
            {expenditureTypeLabel(record.expenditure_type)}
          </span>
          <span className="inline-flex rounded border border-charcoal/12 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-charcoal/70">
            {expenditureSectorLabel(record.sector)}
          </span>
          {record.is_primary_record === false ? (
            <span className="inline-flex rounded border border-charcoal/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-charcoal/55">
              National total: excluded
            </span>
          ) : null}
        </div>
      </div>
      {record.description ? (
        <p className="text-sm text-charcoal/70">{record.description}</p>
      ) : null}
      {disc ? <p className="text-xs text-charcoal/50">{disc}</p> : null}
    </div>
  );
}
