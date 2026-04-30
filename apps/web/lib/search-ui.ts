import type { SearchResult, SearchResultType } from "@the-record/shared-types";

/** URL `types` param for filter chips (maps to the Nest `GET /api/search` filter). */
export type SearchFilterId =
  | "all"
  | "stories"
  | "people"
  | "commissions"
  | "adhoc"
  | "siu"
  | "laws";

export const FILTER_CHIPS: ReadonlyArray<{
  id: SearchFilterId;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "stories", label: "Stories" },
  { id: "people", label: "People" },
  { id: "commissions", label: "Commissions" },
  { id: "adhoc", label: "Ad Hoc" },
  { id: "siu", label: "SIU" },
  { id: "laws", label: "Laws" },
];

/** Maps UI chip → comma-separated `types` query. `undefined` = all types. */
export function filterIdToTypesParam(
  id: SearchFilterId,
): string | undefined {
  if (id === "all") return undefined;
  const m: Record<Exclude<SearchFilterId, "all">, string> = {
    stories: "stories",
    people: "people",
    commissions: "commissions",
    adhoc: "committees",
    siu: "siu",
    laws: "laws,law_sections",
  };
  return m[id];
}

/** Reverse: API `types` string → best chip id (for URL → UI). */
export function typesParamToFilterId(
  types: string | undefined,
): SearchFilterId {
  if (!types || types.trim() === "") return "all";
  const t = types.trim().toLowerCase();
  if (t === "stories" || t === "story") return "stories";
  if (t === "people" || t === "person") return "people";
  if (t === "commissions" || t === "commission") return "commissions";
  if (t === "committees" || t === "committee" || t === "adhoc")
    return "adhoc";
  if (t === "siu") return "siu";
  if (t === "laws" || t === "law" || t.includes("law_section"))
    return "laws";
  return "all";
}

const TYPE_ORDER: SearchResultType[] = [
  "story",
  "person",
  "commission",
  "committee",
  "siu",
  "law",
  "law_section",
  "province",
  "municipality",
];

const GROUP_HEADER: Record<SearchResultType, string> = {
  story: "STORIES",
  person: "PEOPLE",
  commission: "COMMISSIONS",
  committee: "AD HOC COMMITTEES",
  siu: "SIU",
  law: "LAWS",
  law_section: "LAW SECTIONS",
  province: "PROVINCES",
  municipality: "MUNICIPALITIES",
};

export function groupSearchResults(
  results: SearchResult[],
): { type: SearchResultType; items: SearchResult[] }[] {
  const by = new Map<SearchResultType, SearchResult[]>();
  for (const r of results) {
    const b = by.get(r.type) ?? [];
    b.push(r);
    by.set(r.type, b);
  }
  return TYPE_ORDER.filter((t) => by.has(t)).map((t) => ({
    type: t,
    items: by.get(t)!,
  }));
}

export function groupHeaderFor(type: SearchResultType): string {
  return GROUP_HEADER[type];
}

/** Flat list in consistent group order (for keyboard navigation). */
export function flattenGroupedResults(results: SearchResult[]): SearchResult[] {
  return groupSearchResults(results).flatMap((g) => g.items);
}

export function resultKey(r: SearchResult): string {
  return `${r.type}-${r.id}`;
}

export function typeBadgeClass(type: SearchResultType): string {
  switch (type) {
    case "story":
      return "bg-amber/12 text-amber";
    case "person":
      return "bg-timeline-green/10 text-timeline-green";
    case "commission":
      return "bg-legal-blue/10 text-legal-blue";
    case "committee":
      return "bg-purple-500/10 text-purple-700";
    case "siu":
      return "bg-charge-red/[0.08] text-charge-red";
    case "law":
      return "bg-amber/12 text-amber";
    case "law_section":
      return "bg-charcoal/10 text-charcoal/80";
    case "province":
      return "bg-amber/10 text-amber";
    case "municipality":
      return "bg-legal-blue/10 text-legal-blue";
    default:
      return "bg-charcoal/10 text-charcoal";
  }
}

export function typeBadgeLabel(type: SearchResultType): string {
  switch (type) {
    case "story":
      return "Story";
    case "person":
      return "Person";
    case "commission":
      return "Commission";
    case "committee":
      return "Ad Hoc";
    case "siu":
      return "SIU";
    case "law":
      return "Law";
    case "law_section":
      return "Section";
    case "province":
      return "Province";
    case "municipality":
      return "Municipality";
    default:
      return type;
  }
}

/**
 * Build shareable `/search` URLs for filter chips (preserves `q` when set).
 */
export function hrefForSearchPage(
  q: string | undefined,
  filterId: SearchFilterId,
): string {
  const p = new URLSearchParams();
  const t = (q ?? "").trim();
  if (t) p.set("q", t);
  const types = filterIdToTypesParam(filterId);
  if (types) p.set("types", types);
  const s = p.toString();
  return s ? `/search?${s}` : "/search";
}
