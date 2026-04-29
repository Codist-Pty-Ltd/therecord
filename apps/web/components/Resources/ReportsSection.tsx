import type {
  CommissionReport,
  CommissionReportType,
} from "@the-record/shared-types";

const REPORT_TYPE_ORDER: CommissionReportType[] = [
  "final_report",
  "interim_report",
  "supplementary_report",
  "executive_summary",
  "terms_of_reference",
  "recommendations_only",
  "minority_report",
];

function badgeForType(type: CommissionReportType): {
  label: string;
  className: string;
} {
  switch (type) {
    case "final_report":
      return {
        label: "Final report",
        className: "bg-charcoal/[0.08] text-charcoal",
      };
    case "interim_report":
      return {
        label: "Interim",
        className: "bg-amber/10 text-amber",
      };
    case "executive_summary":
      return {
        label: "Summary",
        className: "bg-legal-blue/10 text-legal-blue",
      };
    case "recommendations_only":
      return {
        label: "Recommendations",
        className: "bg-constitutional-gold/15 text-charcoal",
      };
    case "supplementary_report":
      return {
        label: "Supplementary",
        className: "bg-charcoal/[0.06] text-charcoal",
      };
    case "terms_of_reference":
      return {
        label: "Terms of reference",
        className: "bg-charcoal/[0.06] text-charcoal",
      };
    case "minority_report":
      return {
        label: "Minority report",
        className: "bg-charcoal/[0.06] text-charcoal",
      };
  }
}

function formatPublished(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatMetaLine(r: CommissionReport): string {
  const parts: string[] = [];
  const pub = formatPublished(r.published_date);
  if (pub) parts.push(pub);
  if (r.page_count != null) parts.push(`${r.page_count} pp.`);
  if (r.file_size_mb != null) parts.push(`${r.file_size_mb} MB`);
  return parts.join(" · ");
}

function TypeBadge({ type }: { type: CommissionReportType }) {
  const { label, className } = badgeForType(type);
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide ${className}`}
    >
      {label}
    </span>
  );
}

function ReportRow({ report }: { report: CommissionReport }) {
  const meta = formatMetaLine(report);
  const hasExpandable =
    Boolean(report.summary?.trim()) ||
    (report.key_findings != null && report.key_findings.length > 0);

  return (
    <li className="group border border-charcoal/10 bg-cream/80 px-3 py-3 transition duration-150 hover:-translate-y-px hover:border-amber/40 md:px-4 md:py-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <TypeBadge type={report.report_type} />
          {report.volume_number != null ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-charcoal/55">
              Volume {report.volume_number}
            </span>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          {report.volume_title ? (
            <p className="font-mono text-[10px] uppercase tracking-wide text-amber">
              {report.volume_title}
            </p>
          ) : null}
          <p className="font-serif text-sm leading-snug text-charcoal md:text-[15px]">
            {report.title}
          </p>
          {meta ? (
            <p className="mt-1 font-mono text-[10px] text-charcoal/50">{meta}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <a
              href={report.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs font-medium text-amber underline-offset-2 hover:underline"
            >
              Download PDF →
            </a>
            {report.mirror_url && !report.is_verified ? (
              <a
                href={report.mirror_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] text-charcoal/45 underline-offset-2 hover:text-amber hover:underline"
              >
                Alternative link (archive.org)
              </a>
            ) : null}
          </div>
          {hasExpandable ? (
            <details className="mt-3 border-t border-charcoal/10 pt-3">
              <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.16em] text-charcoal/60 marker:text-amber">
                Read summary
              </summary>
              <div className="mt-2 space-y-2 text-sm leading-relaxed text-charcoal/85">
                {report.summary?.trim() ? (
                  <p className="font-sans">{report.summary.trim()}</p>
                ) : null}
                {report.key_findings != null && report.key_findings.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-5 font-sans">
                    {report.key_findings.map((kf, i) => (
                      <li key={`${report.id}-kf-${i}`}>{kf}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </details>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function SingleReportPanel({
  report,
}: {
  report: CommissionReport;
}) {
  const meta = formatMetaLine(report);
  const { label, className } = badgeForType(report.report_type);
  const hasExpandable =
    Boolean(report.summary?.trim()) ||
    (report.key_findings != null && report.key_findings.length > 0);

  return (
    <div className="rounded-sm border border-charcoal/10 border-l-4 border-l-amber bg-cream/90 px-4 py-4 md:px-5 md:py-5">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide ${className}`}
        >
          {label}
        </span>
      </div>
      <h3 className="font-serif text-lg leading-snug text-charcoal md:text-xl">
        {report.title}
      </h3>
      {meta ? (
        <p className="mt-2 font-mono text-[10px] text-charcoal/50">{meta}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href={report.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded border border-amber/40 bg-amber/10 px-3 py-2 font-mono text-xs font-medium text-charcoal transition hover:border-amber hover:bg-amber/15"
        >
          Download PDF →
        </a>
        {report.mirror_url && !report.is_verified ? (
          <a
            href={report.mirror_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] text-charcoal/45 underline-offset-2 hover:text-amber hover:underline"
          >
            Alternative link (archive.org)
          </a>
        ) : null}
      </div>
      {hasExpandable ? (
        <details className="mt-4 border-t border-charcoal/10 pt-4">
          <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.16em] text-charcoal/60 marker:text-amber">
            Read summary
          </summary>
          <div className="mt-2 space-y-2 text-sm leading-relaxed text-charcoal/85">
            {report.summary?.trim() ? (
              <p className="font-sans">{report.summary.trim()}</p>
            ) : null}
            {report.key_findings != null && report.key_findings.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 font-sans">
                {report.key_findings.map((kf, i) => (
                  <li key={`${report.id}-kf-${i}`}>{kf}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </details>
      ) : null}
    </div>
  );
}

export interface ReportsSectionProps {
  reports: CommissionReport[];
  commissionName: string;
}

export default function ReportsSection({
  reports,
  commissionName,
}: ReportsSectionProps) {
  const list = reports ?? [];

  if (list.length === 0) {
    return (
      <section
        aria-label="Official reports"
        className="w-full max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10"
      >
        <h2 className="font-serif text-lg text-charcoal md:text-[18px]">
          Official reports
        </h2>
        <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-charcoal/60">
          The official report for {commissionName} has not been published or
          linked yet.
        </p>
      </section>
    );
  }

  const multiVolume = list.length > 1;

  const byType = new Map<CommissionReportType, CommissionReport[]>();
  for (const r of list) {
    const g = byType.get(r.report_type) ?? [];
    g.push(r);
    byType.set(r.report_type, g);
  }

  for (const [, rows] of byType) {
    rows.sort((a, b) => {
      const vnA = a.volume_number ?? 9999;
      const vnB = b.volume_number ?? 9999;
      if (vnA !== vnB) return vnA - vnB;
      const pa = a.published_date ?? "";
      const pb = b.published_date ?? "";
      if (pa !== pb) return pa.localeCompare(pb);
      return a.title.localeCompare(b.title);
    });
  }

  const orderedTypes = REPORT_TYPE_ORDER.filter((t) => {
    const rows = byType.get(t);
    return rows != null && rows.length > 0;
  });

  if (!multiVolume && list.length === 1) {
    return (
      <section
        aria-label="Official reports"
        className="w-full max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10"
      >
        <h2 className="font-serif text-lg text-charcoal md:text-[18px] mb-5">
          Official reports
        </h2>
        <SingleReportPanel report={list[0]!} />
      </section>
    );
  }

  return (
    <section
      aria-label="Official reports"
      className="w-full max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10"
    >
      <h2 className="font-serif text-lg text-charcoal md:text-[18px] mb-5 md:mb-6">
        Official reports
      </h2>

      <div className="flex flex-col gap-8">
        {orderedTypes.map((type) => {
          const rows = byType.get(type)!;
          return (
            <div key={type}>
              <ul className="flex flex-col gap-3" role="list">
                {rows.map((r) => (
                  <ReportRow key={r.id} report={r} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
