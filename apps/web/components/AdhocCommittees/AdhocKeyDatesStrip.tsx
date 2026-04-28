import type { AdhocCommitteeDetail } from "@the-record/shared-types";

import { formatLongDate } from "@/lib/commissions";

export default function AdhocKeyDatesStrip({
  committee,
}: {
  committee: AdhocCommitteeDetail;
}) {
  const cells: { label: string; value: string }[] = [
    { label: "Announced", value: formatLongDate(committee.announced_date) },
    { label: "First meeting", value: formatLongDate(committee.first_meeting_date) },
    { label: "Concluded", value: formatLongDate(committee.concluded_date) },
    { label: "Report adopted", value: formatLongDate(committee.report_adopted_date) },
  ];

  return (
    <section aria-label="Key dates" className="py-5 md:py-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {cells.map((c) => (
          <div key={c.label} className="flex flex-col gap-1 min-w-0">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-charcoal/45">
              {c.label}
            </span>
            <span className="font-sans text-[14px] text-charcoal leading-snug">
              {c.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
