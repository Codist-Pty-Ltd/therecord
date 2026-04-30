import type { ExpenditureSector, ExpenditureType } from "@the-record/shared-types";

const TYPE_LABELS: Record<ExpenditureType, string> = {
  stolen: "Confirmed stolen",
  allegedly_stolen: "Allegedly stolen",
  fruitless_wasteful: "Fruitless & wasteful",
  irregular: "Irregular expenditure",
  under_investigation: "Under investigation",
  recovered: "Recovered",
  prevented: "Prevented",
};

const SECTOR_LABELS: Record<ExpenditureSector, string> = {
  housing: "Housing",
  construction_roads: "Construction",
  water_sanitation: "Water",
  health: "Health",
  education: "Education",
  social_grants: "Social grants",
  police_security: "Policing",
  energy: "Energy",
  transport: "Transport",
  other_procurement: "Procurement",
  state_owned_enterprise: "SOE",
  other: "Other",
};

export function expenditureTypeLabel(t: ExpenditureType): string {
  return TYPE_LABELS[t] ?? t;
}

export function expenditureSectorLabel(s: ExpenditureSector): string {
  return SECTOR_LABELS[s] ?? s;
}

/** Headline colour for amount by type (editorial emphasis). */
export function expenditureTypeAmountClass(t: ExpenditureType): string {
  switch (t) {
    case "stolen":
    case "allegedly_stolen":
      return "text-charge-red";
    case "recovered":
    case "prevented":
      return "text-timeline-green";
    case "under_investigation":
      return "text-legal-blue";
    default:
      return "text-amber";
  }
}
