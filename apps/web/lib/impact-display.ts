import type { ImpactSeverity } from "@the-record/shared-types";

export const IMPACT_SEVERITY_RANK: Record<ImpactSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function impactSeverityLabel(s: ImpactSeverity): string {
  const m: Record<ImpactSeverity, string> = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
  };
  return m[s];
}

/** For chain visualizer nodes — matches sector slugs to accent colours. */
export const IMPACT_SECTOR_CHAIN_COLOR: Record<string, string> = {
  housing: "#D4A017",
  water: "#3B5EA6",
  health: "#B91C1C",
  education: "#16A34A",
  jobs: "#C8651B",
  safety: "#1C1C1E",
  food: "#CA8A04",
  transport: "#78716C",
};
