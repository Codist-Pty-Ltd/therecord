import type { AgAuditOutcome } from "@the-record/shared-types";

const LABELS: Record<AgAuditOutcome, string> = {
  clean: "Clean audit",
  unqualified_with_findings: "Unqualified (findings)",
  qualified: "Qualified opinion",
  adverse: "Adverse opinion",
  disclaimer: "Disclaimer of opinion",
  outstanding: "Outstanding",
};

export function agAuditLabel(outcome: AgAuditOutcome): string {
  return LABELS[outcome] ?? outcome;
}

/** Tailwind classes for compact audit chips. */
export function agAuditChipClass(outcome: AgAuditOutcome): string {
  switch (outcome) {
    case "clean":
    case "unqualified_with_findings":
      return "bg-timeline-green/12 text-timeline-green border-timeline-green/25";
    case "qualified":
    case "outstanding":
      return "bg-amber/15 text-amber border-amber/35";
    case "disclaimer":
    case "adverse":
    default:
      return "bg-charge-red/10 text-charge-red border-charge-red/25";
  }
}
