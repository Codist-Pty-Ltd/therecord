import type { StoryCategory } from "@the-record/shared-types";

const LABELS: Record<StoryCategory, string> = {
  tender_fraud: "Tender fraud",
  housing_corruption: "Housing",
  construction_mafia: "Construction",
  water_sanitation: "Water",
  health_corruption: "Health",
  education_corruption: "Education",
  social_grants_fraud: "Social grants",
  police_misconduct: "Policing",
  energy_corruption: "Energy",
  state_capture: "State capture",
  whistleblower: "Whistleblower",
  gang_linked_corruption: "Gang-linked",
  other: "Other",
};

export function storyCategoryLabel(cat: StoryCategory): string {
  return LABELS[cat] ?? cat;
}

/** Filter chips on province story list (subset of categories). */
export const PROVINCE_STORY_FILTER_CHIPS: ReadonlyArray<{
  param: StoryCategory | "all";
  label: string;
}> = [
  { param: "all", label: "All" },
  { param: "tender_fraud", label: "Tender Fraud" },
  { param: "housing_corruption", label: "Housing" },
  { param: "water_sanitation", label: "Water" },
  { param: "education_corruption", label: "Education" },
  { param: "other", label: "Other" },
];
