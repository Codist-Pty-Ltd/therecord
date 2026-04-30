/**
 * Display helpers for accountability body (special units) pages.
 * Safe on server and client — no IO.
 */

import type {
  AccountabilityBody,
  AccountabilityBodyCompareRow,
  AccountabilityBodyStatus,
} from "@the-record/shared-types";

const STATUS_ORDER: Record<AccountabilityBodyStatus, number> = {
  active: 0,
  restructured: 1,
  absorbed: 2,
  disbanded: 3,
};

/** Index page: active first, then other statuses, then newest establishment date first. */
export function sortBodiesForAccountabilityIndex(
  bodies: AccountabilityBody[],
): AccountabilityBody[] {
  return [...bodies].sort((a, b) => {
    const sa = STATUS_ORDER[a.status] ?? 99;
    const sb = STATUS_ORDER[b.status] ?? 99;
    if (sa !== sb) return sa - sb;
    return b.established_date.localeCompare(a.established_date);
  });
}

export function bodyStatusChipClasses(status: AccountabilityBodyStatus): {
  label: string;
  wrap: string;
  dot: string;
} {
  switch (status) {
    case "active":
      return {
        label: "ACTIVE",
        wrap: "bg-timeline-green/12 text-timeline-green",
        dot: "bg-timeline-green",
      };
    case "disbanded":
      return {
        label: "DISBANDED",
        wrap: "bg-charge-red/12 text-charge-red",
        dot: "bg-charge-red",
      };
    case "restructured":
    case "absorbed":
      return {
        label: status === "restructured" ? "RESTRUCTURED" : "ABSORBED",
        wrap: "bg-amber/15 text-amber",
        dot: "bg-amber",
      };
    default:
      return {
        label: String(status).toUpperCase(),
        wrap: "bg-charcoal/10 text-charcoal/70",
        dot: "bg-charcoal/40",
      };
  }
}

export function formatBodyYearsActive(body: AccountabilityBody): string {
  const start = body.operational_date ?? body.established_date;
  if (!start) return "—";
  const end =
    body.disbanded_date ??
    (body.status === "active" ? new Date().toISOString().slice(0, 10) : null);
  if (!end) return "—";
  const y0 = Number(start.slice(0, 4));
  const y1 = Number(end.slice(0, 4));
  if (!Number.isFinite(y0) || !Number.isFinite(y1)) return "—";
  const span = Math.max(0, y1 - y0);
  if (body.status === "active") {
    if (span <= 0) return "Active · present";
    return `${span}+ years · present`;
  }
  if (span <= 0) return `${y0}`;
  return `${span} year${span === 1 ? "" : "s"}`;
}

export function convictionRateDisplay(
  pct: string | null | undefined,
): string | null {
  if (pct == null || pct === "") return null;
  const n = Number(pct);
  if (!Number.isFinite(n)) return `${pct}%`;
  return `${n.toFixed(n >= 10 ? 0 : 1)}%`;
}

export type CompareEditorial = {
  canArrest: boolean;
  canProsecute: boolean;
  convictionBar: "full-green" | "partial-amber" | "none";
  convictionLabel: string;
  independence: string;
  independenceTone: "good" | "bad" | "caution";
  yearsLabelOverride?: string;
};

/** Editorial row for the homepage comparison table (three canonical units). */
export function editorialCompareColumn(
  slug: string,
  api: AccountabilityBodyCompareRow | undefined,
): CompareEditorial {
  const baseYears =
    api?.years_active != null
      ? api.status === "active"
        ? api.years_active < 1
          ? "1 year+"
          : `${Math.round(api.years_active)} years · still active`
        : `${Math.round(api.years_active)} years`
      : "—";

  const map: Record<string, CompareEditorial> = {
    "scorpions-dso": {
      canArrest: true,
      canProsecute: true,
      convictionBar: "full-green",
      convictionLabel: "82–94%",
      independence: "High (NPA)",
      independenceTone: "good",
      yearsLabelOverride: "8 years",
    },
    "hawks-dpci": {
      canArrest: true,
      canProsecute: false,
      convictionBar: "partial-amber",
      convictionLabel: "~50%",
      independence: "Low (SAPS)",
      independenceTone: "bad",
      yearsLabelOverride: "Still active",
    },
    idac: {
      canArrest: false,
      canProsecute: false,
      convictionBar: "none",
      convictionLabel: "Too new",
      independence: "Medium",
      independenceTone: "caution",
      yearsLabelOverride: "1 year+",
    },
  };

  const ed = map[slug];
  if (!ed) {
    return {
      canArrest: false,
      canProsecute: false,
      convictionBar: "none",
      convictionLabel: convictionRateDisplay(api?.conviction_rate_percentage) ?? "—",
      independence: "—",
      independenceTone: "caution",
      yearsLabelOverride: baseYears,
    };
  }
  return {
    ...ed,
    yearsLabelOverride: ed.yearsLabelOverride ?? baseYears,
  };
}

export function toneTextClass(tone: "good" | "bad" | "caution"): string {
  switch (tone) {
    case "good":
      return "text-timeline-green";
    case "bad":
      return "text-charge-red";
    default:
      return "text-amber";
  }
}

export function parseNumberedEvidence(text: string): string[] {
  const t = text.trim();
  if (!t) return [];
  return t
    .split(/\s(?=\d+\.\s)/)
    .map((s) => s.trim())
    .filter(Boolean);
}
