import type {
  Investigation,
  InvestigationStatus,
  InvestigationType,
} from "@the-record/shared-types";

interface InvestigationsBarProps {
  investigations: Investigation[];
}

/**
 * Strip of investigative bodies (commissions, parliamentary committees, IPID
 * probes, etc.) running against a story. When exactly two are active we flag
 * it explicitly — the overlap tells a governance story in itself.
 */
export default function InvestigationsBar({
  investigations,
}: InvestigationsBarProps) {
  if (investigations.length === 0) return null;

  const isDual = investigations.length === 2;

  return (
    <section
      aria-label="Investigations"
      className="border-b border-charcoal/10 py-6 md:py-8"
    >
      <div className="flex items-center justify-between mb-4 md:mb-5 gap-3">
        <h2 className="label-smallcaps text-charcoal/55">Investigations</h2>
        <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-charcoal/40">
          {investigations.length}{" "}
          {investigations.length === 1 ? "body" : "bodies"}
        </span>
      </div>

      {isDual ? (
        <p className="flex items-center gap-2 mb-4 md:mb-5 font-mono text-[11px] md:text-xs uppercase tracking-[0.18em] text-amber">
          <span aria-hidden>⚡</span>
          Two bodies are investigating this story simultaneously
        </p>
      ) : null}

      <ul
        className={[
          "flex flex-col gap-3 md:gap-4",
          "lg:flex-row lg:flex-wrap",
          isDual ? "lg:gap-5" : "lg:gap-4",
        ].join(" ")}
      >
        {investigations.map((inv) => (
          <InvestigationCard key={inv.id} inv={inv} fullWidth={isDual} />
        ))}
      </ul>
    </section>
  );
}

function InvestigationCard({
  inv,
  fullWidth,
}: {
  inv: Investigation;
  fullWidth: boolean;
}) {
  return (
    <li
      className={[
        "bg-white rounded-xl md:rounded-2xl",
        "border border-charcoal/10",
        "p-4 md:p-5",
        "flex flex-col gap-3",
        "shadow-[0_1px_3px_rgba(28,28,30,0.04)]",
        fullWidth ? "lg:flex-1 lg:basis-[calc(50%-0.625rem)]" : "lg:flex-1",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center gap-2">
        <TypeBadge type={inv.investigation_type} />
        <StatusBadge status={inv.status} />
      </div>

      <h3 className="font-serif text-[18px] md:text-xl lg:text-[22px] leading-[1.2] text-charcoal">
        {inv.name}
      </h3>

      <dl className="flex flex-col gap-1 text-[13px] md:text-sm text-charcoal/70">
        <div className="flex gap-2">
          <dt className="label-smallcaps text-charcoal/40 shrink-0 pt-0.5">
            Established
          </dt>
          <dd>{inv.established_by}</dd>
        </div>

        <div className="flex gap-2">
          <dt className="label-smallcaps text-charcoal/40 shrink-0 pt-0.5">
            Basis
          </dt>
          <dd className="font-mono text-[11px] md:text-xs text-charcoal/60">
            {inv.legal_basis}
          </dd>
        </div>

        {inv.chair_name ? (
          <div className="flex gap-2">
            <dt className="label-smallcaps text-charcoal/40 shrink-0 pt-0.5">
              Chair
            </dt>
            <dd>{inv.chair_name}</dd>
          </div>
        ) : null}

        {inv.started_at ? (
          <div className="flex gap-2">
            <dt className="label-smallcaps text-charcoal/40 shrink-0 pt-0.5">
              Started
            </dt>
            <dd className="font-mono text-[11px] md:text-xs">
              {formatDate(inv.started_at)}
            </dd>
          </div>
        ) : null}
      </dl>

      {inv.official_url ? (
        <a
          href={inv.official_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[13px] md:text-sm text-legal-blue hover:text-amber underline underline-offset-4 decoration-legal-blue/30 hover:decoration-amber transition-colors self-start"
        >
          Official page
          <span aria-hidden>→</span>
        </a>
      ) : null}
    </li>
  );
}

// ---------- badges ----------

const TYPE_META: Record<
  InvestigationType,
  { label: string; className: string; icon: string }
> = {
  judicial_commission: {
    label: "Judicial Commission",
    className: "bg-legal-blue/10 text-legal-blue border border-legal-blue/20",
    icon: "⚖️",
  },
  parliamentary_committee: {
    label: "Parliamentary Committee",
    className:
      "bg-constitutional-gold/10 text-constitutional-gold border border-constitutional-gold/30",
    icon: "🏛️",
  },
  saps_internal: {
    label: "SAPS Internal",
    className: "bg-charge-red/10 text-charge-red border border-charge-red/20",
    icon: "🚓",
  },
  ipid: {
    label: "IPID",
    className: "bg-amber/10 text-amber border border-amber/20",
    icon: "🔍",
  },
  npa: {
    label: "NPA",
    className: "bg-legal-blue/10 text-legal-blue border border-legal-blue/20",
    icon: "📋",
  },
  other: {
    label: "Other",
    className: "bg-charcoal/5 text-charcoal/70 border border-charcoal/15",
    icon: "🏷",
  },
};

function TypeBadge({ type }: { type: InvestigationType }) {
  const meta = TYPE_META[type] ?? TYPE_META.other;
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
        "font-mono text-[10px] md:text-[11px] uppercase tracking-[0.16em]",
        meta.className,
      ].join(" ")}
    >
      <span aria-hidden className="text-[11px] leading-none">
        {meta.icon}
      </span>
      {meta.label}
    </span>
  );
}

const STATUS_META: Record<
  InvestigationStatus,
  { label: string; dot: string; textClass: string }
> = {
  active: {
    label: "Active",
    dot: "bg-timeline-green",
    textClass: "text-timeline-green",
  },
  concluded: {
    label: "Concluded",
    dot: "bg-charcoal/60",
    textClass: "text-charcoal/70",
  },
  pending_report: {
    label: "Pending report",
    dot: "bg-amber",
    textClass: "text-amber",
  },
  stalled: {
    label: "Stalled",
    dot: "bg-charge-red",
    textClass: "text-charge-red",
  },
};

function StatusBadge({ status }: { status: InvestigationStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5",
        "font-mono text-[10px] md:text-[11px] uppercase tracking-[0.16em]",
        "bg-white border border-charcoal/10",
        meta.textClass,
      ].join(" ")}
    >
      <span aria-hidden className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Johannesburg",
  }).format(date);
}
