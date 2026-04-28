import type {
  AdhocCommitteeCategory,
  AdhocCommitteeLawSectionBrief,
  AdhocCommitteePersonRole,
  LegalReference,
} from "@the-record/shared-types";

export const ADHOC_LAW_GROUP_LABEL: Record<string, string> = {
  enabling: "Enabled by",
  investigated: "Under investigation",
  being_processed_merged: "Being processed / amended",
};

export function lawBriefToLegalReference(
  s: AdhocCommitteeLawSectionBrief,
): LegalReference {
  return {
    act_name: s.law_name,
    short_name: s.law_short_name,
    section: s.section_number,
    relevance: s.section_title,
    is_constitutional: false,
    plain_english: s.plain_english,
  };
}

export function mergeLawSectionsByUsage(sections: {
  enabling: AdhocCommitteeLawSectionBrief[];
  investigated: AdhocCommitteeLawSectionBrief[];
  amended: AdhocCommitteeLawSectionBrief[];
  being_processed: AdhocCommitteeLawSectionBrief[];
}): { key: string; refs: LegalReference[] }[] {
  const mergedProcess = [...sections.amended, ...sections.being_processed];
  const groups: { key: string; refs: LegalReference[] }[] = [];
  if (sections.enabling.length) {
    groups.push({
      key: "enabling",
      refs: sections.enabling.map(lawBriefToLegalReference),
    });
  }
  if (sections.investigated.length) {
    groups.push({
      key: "investigated",
      refs: sections.investigated.map(lawBriefToLegalReference),
    });
  }
  if (mergedProcess.length) {
    groups.push({
      key: "being_processed_merged",
      refs: mergedProcess.map(lawBriefToLegalReference),
    });
  }
  return groups;
}

/** Long-form category copy for committee detail pages. */
export const ADHOC_CATEGORY_DETAIL: Record<
  AdhocCommitteeCategory,
  string
> = {
  accountability: "Investigating misconduct or wrongdoing.",
  constitutional_amendment: "Changing the Constitution.",
  legislation: "Processing or creating a new law.",
  appointments: "Recommending candidates for Chapter 9 positions.",
  disaster_response: "Responding to a national emergency.",
  oversight: "Parliamentary oversight of the executive or entities.",
  other: "Other parliamentary work.",
};

/** Display order for people groups on the committee detail page. */
export const ADHOC_DETAIL_ROLE_ORDER: AdhocCommitteePersonRole[] = [
  "chair",
  "member",
  "witness",
  "implicated",
  "legal_rep",
  "secretary",
];

export const ADHOC_DETAIL_ROLE_HEADING: Record<
  AdhocCommitteePersonRole,
  string
> = {
  chair: "Chair",
  member: "Members",
  witness: "Witnesses",
  implicated: "Subject of inquiry",
  legal_rep: "Legal representatives",
  secretary: "Secretary",
};
