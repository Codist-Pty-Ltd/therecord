/**
 * @the-record/shared-types
 *
 * TypeScript types shared across the monorepo. Consumed primarily by
 * `apps/web` (Next.js 15) to type API responses from `apps/api` (NestJS 10).
 *
 * The package ships as raw `.ts` source — consumers transpile it via their
 * own pipelines (Next.js `transpilePackages`, NestJS `ts-node`/`tsc`).
 *
 * Organisation:
 *   1. Enum unions      — string literal unions that mirror the TypeORM enums.
 *   2. Entity interfaces — one-to-one mirror of each `apps/api/src/entities/*.entity.ts`.
 *   3. API projections   — response-shape helpers used by the frontend; these
 *                          compose the entity interfaces with resolved relations.
 *
 * A mismatch between the entity interfaces here and the TypeORM entities in
 * `apps/api` is a protocol-level bug between frontend and API. Keep them in
 * lock-step — if you change a column, change both.
 */

// -----------------------------------------------------------------------------
// 1. Enum unions — match `apps/api/src/entities/*.entity.ts` exactly.
// -----------------------------------------------------------------------------

export type StoryDomain =
  | "criminal_justice"
  | "politics"
  | "organised_crime"
  | "business"
  | "labour";

export type StoryStatus = "active" | "resolved" | "dormant";

export type StoryCategory =
  | "tender_fraud"
  | "housing_corruption"
  | "construction_mafia"
  | "water_sanitation"
  | "health_corruption"
  | "education_corruption"
  | "social_grants_fraud"
  | "police_misconduct"
  | "energy_corruption"
  | "state_capture"
  | "whistleblower"
  | "gang_linked_corruption"
  | "other";

export type MunicipalityType = "metropolitan" | "local" | "district";

export type AgAuditOutcome =
  | "clean"
  | "unqualified_with_findings"
  | "qualified"
  | "adverse"
  | "disclaimer"
  | "outstanding";

export type AmountQualifier =
  | "exact"
  | "approximate"
  | "minimum"
  | "maximum"
  | "under_investigation";

export type ExpenditureType =
  | "stolen"
  | "allegedly_stolen"
  | "fruitless_wasteful"
  | "irregular"
  | "under_investigation"
  | "recovered"
  | "prevented";

export type ExpenditureSector =
  | "housing"
  | "construction_roads"
  | "water_sanitation"
  | "health"
  | "education"
  | "social_grants"
  | "police_security"
  | "energy"
  | "transport"
  | "other_procurement"
  | "state_owned_enterprise"
  | "other";

export type SimilarityReason =
  | "same_province"
  | "same_municipality"
  | "same_sector"
  | "same_accused"
  | "same_category"
  | "same_pattern";

export type EventType =
  | "incident"
  | "press_conference"
  | "arrest"
  | "charge_filed"
  | "commission_established"
  | "hearing"
  | "judgment"
  | "suspension"
  | "resignation"
  | "statement"
  | "acquittal"
  | "other";

export type EventSignificance = "low" | "medium" | "high" | "critical";

export type PersonStatus =
  | "active"
  | "suspended"
  | "charged"
  | "acquitted"
  | "resigned"
  | "unknown";

export type LawCategory =
  | "corruption"
  | "policing"
  | "prosecution"
  | "organised_crime"
  | "whistleblower"
  | "constitutional"
  | "other";

export type InvestigationType =
  | "judicial_commission"
  | "parliamentary_committee"
  | "saps_internal"
  | "ipid"
  | "npa"
  | "other";

export type InvestigationStatus =
  | "active"
  | "concluded"
  | "pending_report"
  | "stalled";

/**
 * Commission domains are a superset of {@link StoryDomain} — commissions can
 * probe areas that are not themselves story beats on The Record.
 */
export type CommissionDomain =
  | "criminal_justice"
  | "politics"
  | "organised_crime"
  | "business"
  | "labour"
  | "human_rights"
  | "financial"
  | "education"
  | "policing"
  | "public_safety"
  | "corruption";

export type CommissionStatus =
  | "active"
  | "concluded"
  | "pending_report"
  | "stalled"
  | "never_reported";

/**
 * How a law section relates to a commission:
 *   - `enabling`      — the section under which the commission was created.
 *   - `investigated`  — the section whose violation was being probed.
 *   - `violated`      — the section found to have been violated.
 *   - `recommended`   — the section the commission recommended be changed.
 */
export type CommissionLawSectionUsage =
  | "enabling"
  | "investigated"
  | "violated"
  | "recommended";

export type CommissionPersonRole =
  | "chair"
  | "evidence_leader"
  | "witness"
  | "implicated"
  | "legal_rep"
  | "commissioner"
  | "secretary"
  | "subject_of_inquiry"
  | "established_by";

/**
 * Ad hoc committee taxonomy — distinct from commissions of inquiry because
 * these are Parliamentary instruments (s55(2) + NA Rule 253), not executive
 * ones. See `adhoc_committee.entity.ts` in `apps/api`.
 */
export type AdhocCommitteeCategory =
  | "accountability"
  | "constitutional_amendment"
  | "legislation"
  | "appointments"
  | "disaster_response"
  | "oversight"
  | "other";

export type AdhocCommitteeStatus =
  | "active"
  | "concluded"
  | "lapsed"
  | "mandate_completed";

export type AdhocCommitteePersonRole =
  | "chair"
  | "member"
  | "witness"
  | "implicated"
  | "legal_rep"
  | "secretary";

export type AdhocCommitteeLawSectionUsage =
  | "enabling"
  | "investigated"
  | "amended"
  | "being_processed";

/**
 * Back-compat alias. Prefer `EventType` in new code; this exists so the
 * current web app keeps compiling after the rename from the earlier
 * `TimelineEventType` spelling.
 */
export type TimelineEventType = EventType;

// -----------------------------------------------------------------------------
// 2. Entity interfaces — one per TypeORM entity. Field names, nullability and
//    shape match `apps/api/src/entities/*.entity.ts` exactly.
//
//    Dates are ISO strings because that is how they serialise across HTTP:
//      - `timestamptz` → ISO 8601 string (e.g. `2025-09-17T14:32:00.000Z`)
//      - `date`        → `YYYY-MM-DD`
// -----------------------------------------------------------------------------

/** Mirrors `province.entity.ts`. */
export interface Province {
  id: string;
  name: string;
  slug: string;
  abbreviation: string | null;
  capital: string | null;
  premier_name: string | null;
  corruption_watch_complaint_percentage: string | null;
  auditor_general_irregular_expenditure_rands: string | null;
  ag_report_year: string | null;
  created_at: string;
}

/** Mirrors `municipality.entity.ts`. */
export interface Municipality {
  id: string;
  name: string;
  short_name: string;
  slug: string;
  municipality_type: MunicipalityType;
  province_id: string;
  mayor_name: string | null;
  governing_party: string | null;
  annual_budget_rands: string | null;
  ag_audit_outcome: AgAuditOutcome | null;
  ag_audit_year: string | null;
  ag_irregular_expenditure_rands: string | null;
  plain_english_audit_outcome: string | null;
  created_at: string;
  updated_at: string;
}

/** Mirrors `public-expenditure-record.entity.ts`. */
export interface PublicExpenditureRecord {
  id: string;
  story_id: string;
  province_id: string | null;
  municipality_id: string | null;
  amount_rands: string;
  amount_qualifier: AmountQualifier;
  expenditure_type: ExpenditureType;
  sector: ExpenditureSector;
  description: string;
  plain_english: string | null;
  source_document: string | null;
  source_url: string | null;
  reference_date: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

/** Response shape of `GET /api/expenditure/counter` (Nest `ExpenditureCounterResponseDto`). */
export interface ExpenditureCounter {
  total_tracked_rands: number;
  total_under_investigation_rands: number;
  total_allegedly_stolen_rands: number;
  total_confirmed_stolen_rands: number;
  total_recovered_rands: number;
  total_prevented_rands: number;
  total_fruitless_wasteful_rands: number;
  story_count: number;
  province_count: number;
  by_province: {
    province_name: string;
    slug: string;
    total_rands: number;
    story_count: number;
  }[];
  by_sector: {
    sector: ExpenditureSector;
    total_rands: number;
    story_count: number;
  }[];
  updated_at: string;
}

/** Mirrors `similar-story.entity.ts`. */
export interface SimilarStory {
  id: string;
  story_id: string;
  similar_story_id: string;
  similarity_reason: SimilarityReason;
  similarity_note: string | null;
  created_at: string;
}

/** Mirrors `story.entity.ts`. */
export interface Story {
  id: string;
  title: string;
  slug: string;
  domain: StoryDomain;
  status: StoryStatus;
  summary: string | null;
  plain_english_summary: string | null;
  /**
   * When set, links the story to a {@link Commission}. Null for standalone
   * stories that don't live inside a commission of inquiry.
   */
  commission_id: string | null;
  /**
   * When set, links the story to an {@link AdhocCommittee}. Independent of
   * `commission_id`: a story can belong to both (executive + legislative
   * oversight of the same matter — Mkhwanazi is the canonical example).
   */
  adhoc_committee_id: string | null;
  /**
   * When set, links the story to an {@link SiuProclamation}. Independent
   * of the two FKs above: a story can be linked to a commission, a
   * committee and an SIU proclamation simultaneously when all three
   * touch the same matter.
   */
  siu_proclamation_id: string | null;
  province_id: string | null;
  municipality_id: string | null;
  story_category: StoryCategory | null;
  /** Cached sum of expenditure records (whole rands); serialized as string. */
  total_amount_rands: string | null;
  created_at: string;
  updated_at: string;
  /** Optional — when the API joins province scope. */
  province?: Province | null;
  /** Optional — when the API joins municipality scope. */
  municipality?: Municipality | null;
  /** Optional — loaded on story detail when expenditure rows are included. */
  expenditure_records?: PublicExpenditureRecord[];
  /** Optional — editorial “similar threads” links. */
  similar_stories?: SimilarStory[];
}
export interface TimelineEvent {
  id: string;
  story_id: string;
  event_date: string;
  event_type: EventType;
  title: string;
  description: string;
  plain_english: string | null;
  significance: EventSignificance;
  source_urls: string[];
  created_at: string;
}

/** Mirrors `person.entity.ts`. */
export interface Person {
  id: string;
  full_name: string;
  aliases: string[];
  current_role: string | null;
  organisation: string | null;
  status: PersonStatus;
  profile_summary: string | null;
  created_at: string;
  updated_at: string;
  /**
   * Distinct commissions of inquiry (from `commission_person`). Set on
   * `GET /api/people` list responses and person detail; omit on other payloads.
   */
  commission_count?: number;
}

/**
 * Mirrors `story_person.entity.ts` — the story ↔ person join table, with
 * per-story role metadata.
 */
export interface StoryPerson {
  id: string;
  story_id: string;
  person_id: string;
  role_in_story: string;
  is_key_figure: boolean;
}

/** Mirrors `law.entity.ts`. */
export interface Law {
  id: string;
  name: string;
  short_name: string;
  act_number: string;
  category: LawCategory;
  plain_english: string;
  full_text_url: string | null;
}

/** Mirrors `law_section.entity.ts`. */
export interface LawSection {
  id: string;
  law_id: string;
  section_number: string;
  section_title: string;
  plain_english: string;
  full_text: string | null;
}

/** Mirrors `constitution_section.entity.ts`. */
export interface ConstitutionSection {
  id: string;
  chapter_number: number;
  section_number: number;
  section_title: string;
  plain_english: string;
  full_text: string | null;
}

/**
 * Mirrors `event_legal_reference.entity.ts` — exactly one of
 * `law_section_id` / `constitution_section_id` is populated on any given row.
 */
export interface EventLegalReference {
  id: string;
  event_id: string;
  law_section_id: string | null;
  constitution_section_id: string | null;
  relevance: string;
  alleged_violation: boolean;
}

/** Mirrors `article.entity.ts`. */
export interface Article {
  id: string;
  story_id: string;
  source_name: string;
  source_url: string;
  headline: string;
  published_at: string;
  content_snippet: string;
  ai_processed: boolean;
  created_at: string;
}

/** Mirrors `investigation.entity.ts`. */
export interface Investigation {
  id: string;
  story_id: string;
  name: string;
  investigation_type: InvestigationType;
  established_by: string;
  legal_basis: string;
  chair_name: string | null;
  status: InvestigationStatus;
  official_url: string | null;
  started_at: string | null;
  concluded_at: string | null;
}

/**
 * Mirrors `commission.entity.ts`. A top-level commission of inquiry that
 * lives independently of any one story — stories can link to it via
 * `story.commission_id`.
 *
 * API responses expose `cost_rands` as a whole number of rands (parsed from
 * the database `bigint`); values beyond `Number.MAX_SAFE_INTEGER` are sent
 * as null.
 */
export interface Commission {
  id: string;
  popular_name: string;
  full_name: string;
  slug: string;
  domain: CommissionDomain;
  enabling_legislation: string;
  constitution_section_invoked: string;
  reason_summary: string;
  plain_english_summary: string;
  chair_name: string;
  announced_date: string | null;
  hearings_started: string | null;
  concluded_date: string | null;
  report_released_date: string | null;
  status: CommissionStatus;
  official_url: string | null;
  report_url: string | null;
  cost_rands: number | null;
  total_hearing_days: number | null;
  outcome_summary: string | null;
  produced_prosecutions: boolean | null;
  /** Null for commissions established by a provincial Premier or statutory body. */
  president_who_established: string | null;
  created_at: string;
  updated_at: string;
}

/** Mirrors `commission_law_section.entity.ts`. */
export interface CommissionLawSection {
  id: string;
  commission_id: string;
  law_section_id: string;
  usage_type: CommissionLawSectionUsage;
}

/** Mirrors `commission_person.entity.ts`. */
export interface CommissionPerson {
  id: string;
  commission_id: string;
  person_id: string;
  role: CommissionPersonRole;
  summary: string | null;
}

/**
 * Mirrors `adhoc_committee.entity.ts`. Parliamentary ad hoc committees are
 * separate from {@link Commission}s of inquiry — they are legislative
 * instruments struck under s55(2) + NA Rule 253, not executive ones. A
 * committee can cross-link to a commission when both bodies probe the same
 * matter (see `related_commission_id`).
 */
export interface AdhocCommittee {
  id: string;
  popular_name: string;
  full_name: string;
  slug: string;
  parliament_term: string | null;
  parliament_years: string | null;
  domain: CommissionDomain;
  category: AdhocCommitteeCategory;
  established_by: string;
  enabling_provision: string | null;
  is_joint_committee: boolean;
  chair_name: string | null;
  mandate_summary: string;
  plain_english_summary: string;
  announced_date: string | null;
  first_meeting_date: string | null;
  concluded_date: string | null;
  report_adopted_date: string | null;
  status: AdhocCommitteeStatus;
  outcome_summary: string | null;
  produced_legislative_change: boolean | null;
  produced_accountability_action: boolean | null;
  report_url: string | null;
  parliament_url: string | null;
  related_commission_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Mirrors `adhoc_committee_person.entity.ts`. */
export interface AdhocCommitteePerson {
  id: string;
  adhoc_committee_id: string;
  person_id: string;
  role: AdhocCommitteePersonRole;
  party_affiliation: string | null;
  summary: string | null;
}

/** Mirrors `adhoc_committee_law_section.entity.ts`. */
export interface AdhocCommitteeLawSection {
  id: string;
  adhoc_committee_id: string;
  law_section_id: string;
  usage_type: AdhocCommitteeLawSectionUsage;
}

// -----------------------------------------------------------------------------
// 3. API projection types — composition helpers used by the frontend.
//
//    These are NOT entity mirrors. They describe what the API *returns* after
//    joining related records together (i.e. the shape of resolved DTOs).
// -----------------------------------------------------------------------------

/**
 * Flat view of a legal reference as it appears on a timeline event in the
 * `GET /api/stories/:slug` response. This is the denormalised shape the web
 * renders — the API resolves `event_legal_references` → `law_section` → `law`
 * (or `constitution_section`) into this single object before sending.
 */
export interface LegalReference {
  act_name: string;
  short_name: string;
  section: string;
  relevance: string;
  is_constitutional: boolean;
  act_number?: string | null;
  /** Child-level plain-English explanation of the statute / section. */
  plain_english?: string | null;
}

/**
 * A `StoryPerson` row with its related `Person` resolved inline, as returned
 * by the story detail endpoint.
 */
export interface StoryPersonWithPerson extends StoryPerson {
  person: Person;
}

/**
 * A `TimelineEvent` with its resolved legal references attached, as returned
 * by the story detail endpoint.
 */
export interface TimelineEventWithReferences extends TimelineEvent {
  legal_references?: LegalReference[];
}

/**
 * Response shape of `GET /api/stories/:slug` — the full story dossier, with
 * every relation needed to render the story detail page.
 */
export interface StoryDetail extends Story {
  timeline_events: TimelineEventWithReferences[];
  people: StoryPersonWithPerson[];
  investigations: Investigation[];
  articles: Article[];
}

/**
 * Row returned by `GET /api/stories` (list view, minimal). Extends `Story`
 * with the most recent event date computed server-side.
 */
export interface StorySummary extends Story {
  /** ISO date (`YYYY-MM-DD`) of the most recent event, or null when empty. */
  latest_event_date: string | null;
  /** Optional — set by placeholder content on the homepage; not returned by the API. */
  event_count?: number;
}

// -----------------------------------------------------------------------------
// Legal projections (`GET /api/legal/...`)
//
// `GET /api/legal/laws`                              → LawSummary[]
// `GET /api/legal/laws/:id`                          → LawWithSections
// `GET /api/legal/laws/:lawId/sections/:sectionId`   → LawSectionDetail
//
// The detail endpoint bundles every commission, ad hoc committee, and story
// that references the section so the frontend can render the editorial
// "applied in" panel in a single round-trip. SIU proclamations are absent
// because the schema has no `siu_proclamation_law_sections` join table yet —
// derive SIU links from any story in `stories[]` whose `siu_proclamation_id`
// is set, if you need to surface them.
// -----------------------------------------------------------------------------

/** Row returned by `GET /api/legal/laws`. Identical shape to {@link Law}. */
export type LawSummary = Law;

/** Response shape of `GET /api/legal/laws/:id`. */
export interface LawWithSections extends Law {
  sections: LawSection[];
}

/** A commission row in the `applied in` strip, with the join's `usage_type`. */
export interface CommissionUsingLawSection {
  id: string;
  popular_name: string;
  slug: string;
  domain: CommissionDomain;
  status: CommissionStatus;
  chair_name: string | null;
  announced_date: string | null;
  concluded_date: string | null;
  /** Most editorially representative year (announced → started → reported). */
  era_year: string | null;
  usage_type: CommissionLawSectionUsage;
}

/** An ad hoc committee row in the `applied in` strip. */
export interface AdhocCommitteeUsingLawSection {
  id: string;
  popular_name: string;
  slug: string;
  category: AdhocCommitteeCategory;
  status: AdhocCommitteeStatus;
  parliament_term: string | null;
  parliament_years: string | null;
  announced_date: string | null;
  concluded_date: string | null;
  era_year: string | null;
  usage_type: AdhocCommitteeLawSectionUsage;
}

/**
 * A story whose timeline contains at least one event citing this section.
 * `event_count` is the per-story event tally and `alleged_violation` is the
 * OR of every contributing event's flag — both useful editorial signals.
 */
export interface StoryReferencingLawSection {
  id: string;
  title: string;
  slug: string;
  domain: StoryDomain;
  status: StoryStatus;
  summary: string | null;
  /** Most recent contributing event date. ISO `YYYY-MM-DD`. */
  latest_event_date: string | null;
  event_count: number;
  alleged_violation: boolean;
}

/** Response shape of `GET /api/legal/laws/:lawId/sections/:sectionId`. */
export interface LawSectionDetail extends LawSection {
  law: Law;
  commissions: CommissionUsingLawSection[];
  adhoc_committees: AdhocCommitteeUsingLawSection[];
  stories: StoryReferencingLawSection[];
  siu_proclamations: SiuProclamationCitingSection[];
}

// -----------------------------------------------------------------------------
// Commission projections (`GET /api/commissions/...`)
// -----------------------------------------------------------------------------

/** Row returned by `GET /api/commissions` — `Commission` plus a story count. */
export interface CommissionSummary extends Commission {
  /** Number of stories linked to this commission. */
  story_count?: number;
}

/** A story listed under a commission (embedded in detail / compare responses). */
export interface CommissionStoryBrief {
  id: string;
  title: string;
  slug: string;
  domain: string;
  status: string;
  summary: string | null;
  latest_event_date: string | null;
}

/** A person who plays a role at a commission, with their person details inlined. */
export interface CommissionPersonBrief {
  id: string;
  commission_id: string;
  person_id: string;
  full_name: string;
  current_role: string | null;
  organisation: string | null;
  person_status: PersonStatus;
  role: CommissionPersonRole;
  summary: string | null;
}

/** Law section linked to a commission, with the section text already resolved. */
export interface CommissionLawSectionBrief {
  id: string;
  commission_id: string;
  law_section_id: string;
  usage_type: CommissionLawSectionUsage;
  section_number: string;
  section_title: string;
  plain_english: string;
  law_name: string;
  law_short_name: string;
}

/** Law sections attached to a commission, bucketed by their `usage_type`. */
export interface LawSectionsByUsage {
  enabling: CommissionLawSectionBrief[];
  investigated: CommissionLawSectionBrief[];
  violated: CommissionLawSectionBrief[];
  recommended: CommissionLawSectionBrief[];
}

/** A single timeline event on a commission's unified timeline. */
export interface CommissionTimelineEvent {
  id: string;
  story_id: string;
  story_title: string;
  story_slug: string;
  event_date: string;
  event_type: EventType;
  title: string;
  description: string;
  plain_english: string;
  significance: EventSignificance;
}

/** Mirrors `commission-report.entity.ts`. */
export type CommissionReportType =
  | "final_report"
  | "interim_report"
  | "supplementary_report"
  | "terms_of_reference"
  | "executive_summary"
  | "recommendations_only"
  | "minority_report";

/** Alias for {@link CommissionReportType} (prompt naming). */
export type ReportType = CommissionReportType;

export interface CommissionReport {
  id: string;
  commission_id: string | null;
  adhoc_committee_id: string | null;
  siu_proclamation_id: string | null;
  volume_number: number | null;
  volume_title: string | null;
  report_type: CommissionReportType;
  title: string;
  published_date: string | null;
  page_count: number | null;
  file_size_mb: number | null;
  source_url: string;
  mirror_url: string | null;
  is_verified: boolean;
  language: string;
  summary: string | null;
  key_findings: string[] | null;
  created_at: string;
  updated_at: string;
}

/** Response shape of `GET /api/commissions/:slug/reports`. */
export interface CommissionReportsGrouped {
  slug: string;
  by_type: Partial<Record<CommissionReportType, CommissionReport[]>>;
}

// -----------------------------------------------------------------------------
// Recommendations (`recommendations` table + commission detail bundle)
// -----------------------------------------------------------------------------

export type RecommendationCategory =
  | "prosecution"
  | "legislation"
  | "policy"
  | "institutional"
  | "disciplinary"
  | "further_investigation"
  | "compensation"
  | "appointment"
  | "other";

export type ImplementationStatus =
  | "implemented"
  | "partially_implemented"
  | "not_implemented"
  | "in_progress"
  | "rejected"
  | "unknown";

export interface Recommendation {
  id: string;
  commission_id: string | null;
  adhoc_committee_id: string | null;
  reference_number: string | null;
  title: string;
  full_text: string | null;
  plain_english: string | null;
  plain_english_child: string | null;
  category: RecommendationCategory;
  directed_at: string | null;
  persons_named: string[] | null;
  implementation_status: ImplementationStatus;
  implementation_notes: string | null;
  implementation_date: string | null;
  implementation_source_url: string | null;
  volume_reference: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecommendationStatusCounts {
  implemented: number;
  partially_implemented: number;
  not_implemented: number;
  in_progress: number;
  rejected: number;
  unknown: number;
}

export interface RecommendationsByCategory {
  prosecution: Recommendation[];
  legislation: Recommendation[];
  policy: Recommendation[];
  institutional: Recommendation[];
  disciplinary: Recommendation[];
  further_investigation: Recommendation[];
  compensation: Recommendation[];
  appointment: Recommendation[];
  other: Recommendation[];
}

export interface CommissionRecommendationBundle {
  by_category: RecommendationsByCategory;
  status_counts: RecommendationStatusCounts;
}

/** `GET /api/recommendations/stats` */
export interface RecommendationStats {
  total: number;
  by_status: RecommendationStatusCounts;
  by_category: Record<string, number>;
  implementation_rate: number;
}

/** `GET /api/commissions/:slug/recommendations` */
export interface CommissionRecommendationsResponse {
  slug: string;
  recommendations: Recommendation[];
  status_counts: RecommendationStatusCounts;
}

/** Response shape of `GET /api/commissions/:slug`. */
export interface CommissionDetail extends CommissionSummary {
  stories: CommissionStoryBrief[];
  people: CommissionPersonBrief[];
  law_sections: LawSectionsByUsage;
  timeline: CommissionTimelineEvent[];
  reports: CommissionReport[];
  recommendations_summary: CommissionRecommendationBundle;
}

/** One side of a commission vs. commission comparison. */
export interface CommissionCompareSide {
  id: string;
  popular_name: string;
  slug: string;
  domain: CommissionDomain;
  status: CommissionStatus;
  chair_name: string;
  president_who_established: string | null;
  announced_date: string | null;
  hearings_started: string | null;
  concluded_date: string | null;
  report_released_date: string | null;
  duration_days: number | null;
  cost_rands: number | null;
  total_hearing_days: number | null;
  produced_prosecutions: boolean | null;
  laws_invoked: string[];
  people_implicated: string[];
  story_count: number;
}

/** Side-by-side delta between the two sides of a compare response. */
export interface CommissionCompareDelta {
  duration_delta_days: number | null;
  cost_delta_rands: number | null;
  hearing_days_delta: number | null;
  prosecutions_winner: "left" | "right" | "both" | "neither" | "unknown";
}

/** Response shape of `GET /api/commissions/compare?left=&right=`. */
export interface CommissionCompareResponse {
  left: CommissionCompareSide;
  right: CommissionCompareSide;
  delta: CommissionCompareDelta;
  implicated_role: CommissionPersonRole;
}

// -----------------------------------------------------------------------------
// Ad hoc committee projections (`GET /api/adhoc-committees/...`)
// -----------------------------------------------------------------------------

/** Row returned by `GET /api/adhoc-committees` — `AdhocCommittee` plus a story count. */
export interface AdhocCommitteeSummary extends AdhocCommittee {
  /** Number of stories linked to this committee. */
  story_count?: number;
}

/** A story listed under a committee, embedded in detail responses. */
export interface AdhocCommitteeStoryBrief {
  id: string;
  title: string;
  slug: string;
  domain: string;
  status: string;
  summary: string | null;
  latest_event_date: string | null;
}

/** A person on a committee, with their person details inlined. */
export interface AdhocCommitteePersonBrief {
  id: string;
  adhoc_committee_id: string;
  person_id: string;
  full_name: string;
  current_role: string | null;
  organisation: string | null;
  person_status: PersonStatus;
  role: AdhocCommitteePersonRole;
  party_affiliation: string | null;
  summary: string | null;
}

/** Law section linked to a committee with the section text already resolved. */
export interface AdhocCommitteeLawSectionBrief {
  id: string;
  adhoc_committee_id: string;
  law_section_id: string;
  usage_type: AdhocCommitteeLawSectionUsage;
  section_number: string;
  section_title: string;
  plain_english: string;
  law_name: string;
  law_short_name: string;
}

/** Committee members + witnesses bucketed by role. */
export interface AdhocCommitteePeopleByRole {
  chair: AdhocCommitteePersonBrief[];
  member: AdhocCommitteePersonBrief[];
  witness: AdhocCommitteePersonBrief[];
  implicated: AdhocCommitteePersonBrief[];
  legal_rep: AdhocCommitteePersonBrief[];
  secretary: AdhocCommitteePersonBrief[];
}

/** Law sections attached to a committee, bucketed by their `usage_type`. */
export interface AdhocCommitteeLawSectionsByUsage {
  enabling: AdhocCommitteeLawSectionBrief[];
  investigated: AdhocCommitteeLawSectionBrief[];
  amended: AdhocCommitteeLawSectionBrief[];
  being_processed: AdhocCommitteeLawSectionBrief[];
}

/** A single timeline event on a committee's unified timeline. */
export interface AdhocCommitteeTimelineEvent {
  id: string;
  story_id: string;
  story_title: string;
  story_slug: string;
  event_date: string;
  event_type: EventType;
  title: string;
  description: string;
  plain_english: string;
  significance: EventSignificance;
}

/**
 * Lightweight commission card used on the committee detail page when the
 * legislature and the executive are probing the same matter. Subset of
 * {@link Commission} — just enough to render a "See also" block.
 */
export interface AdhocCommitteeRelatedCommission {
  id: string;
  popular_name: string;
  slug: string;
  domain: CommissionDomain;
  status: CommissionStatus;
  chair_name: string;
  produced_prosecutions: boolean | null;
  announced_date: string | null;
  concluded_date: string | null;
}

/** Response shape of `GET /api/adhoc-committees/:slug`. */
export interface AdhocCommitteeDetail extends AdhocCommitteeSummary {
  stories: AdhocCommitteeStoryBrief[];
  people: AdhocCommitteePeopleByRole;
  law_sections: AdhocCommitteeLawSectionsByUsage;
  related_commission: AdhocCommitteeRelatedCommission | null;
  timeline: AdhocCommitteeTimelineEvent[];
}

/** Response shape of `GET /api/adhoc-committees/by-parliament/:term`. */
export interface AdhocCommitteesByParliamentResponse {
  parliament_term: string;
  data: AdhocCommitteeSummary[];
  total: number;
}

// -----------------------------------------------------------------------------
// Special Investigating Unit (SIU) — GET /api/siu/*
//
// The SIU sits alongside Commissions and Ad Hoc Committees but is its own
// architectural beast: a permanent statutory body that is *activated*
// per-investigation by a Presidential Proclamation, can recover money via
// the Special Tribunal, and refers downstream to NPA / Hawks / departments.
// Schema mirrors `apps/api/src/entities/siu_*.entity.ts` and
// `apps/api/src/siu/dto/siu-response.dto.ts`.
//
// Bigint Rand values are returned as strings to preserve precision over
// JSON (cumulative figures cross `Number.MAX_SAFE_INTEGER`).
// -----------------------------------------------------------------------------

export type ProclamationStatus =
  | "active"
  | "concluded"
  | "report_submitted"
  | "litigation_ongoing";

export type TribunalCaseStatus =
  | "pending"
  | "hearing"
  | "judgment_delivered"
  | "settled"
  | "withdrawn"
  | "appeal_pending";

export type SiuPersonRole =
  | "investigated"
  | "implicated"
  | "whistleblower"
  | "referred_to_npa"
  | "referred_disciplinary"
  | "convicted"
  | "acquitted";

/** Mirrors `siu_body.entity.ts`. Singleton institutional record. */
export interface SiuBody {
  id: string;
  name: string;
  abbreviation: string;
  enabling_legislation: string;
  established_date: string;
  headquarters: string;
  hotline: string;
  current_head: string | null;
  website_url: string;
  mandate_summary: string;
  plain_english_summary: string;
  created_at: string;
}

/** Mirrors `siu_proclamation.entity.ts`. */
export interface SiuProclamation {
  id: string;
  proclamation_number: string;
  slug: string;
  title: string;
  full_title: string | null;
  gazette_number: string | null;
  signed_date: string | null;
  published_date: string | null;
  domain: CommissionDomain;
  investigation_scope: string;
  plain_english_summary: string;
  president_who_signed: string;
  period_covered_start: string | null;
  period_covered_end: string | null;
  status: ProclamationStatus;
  related_commission_id: string | null;
  related_adhoc_committee_id: string | null;
  official_url: string | null;
  created_at: string;
  updated_at: string;
}

/** Usage labels on `siu_proclamation_law_sections` (distinct from commission). */
export type SiuLawUsageType =
  | "enabling"
  | "investigated"
  | "violated"
  | "recovered_under";

/**
 * One `siu_proclamation_law_sections` row with nested proclamation and
 * target section(s) — the shape used on proclamation detail
 * (`law_sections_by_usage`) and law-section "Applied in" (with only the
 * proclamation and usage columns populated on reverse lookups).
 */
export interface SiuProclamationLawSection {
  id: string;
  proclamation: SiuProclamation;
  law_section?: LawSection | null;
  constitution_section?: ConstitutionSection | null;
  usage_type: SiuLawUsageType;
  relevance?: string | null;
}

export interface SiuProclamation {
  law_sections?: SiuProclamationLawSection[];
}
export interface LawSection {
  siu_proclamations?: SiuProclamationLawSection[];
}
export interface ConstitutionSection {
  siu_proclamations?: SiuProclamationLawSection[];
}

/**
 * List-view shape — extends {@link SiuProclamation} with denormalised
 * read-time aggregates so the UI can render the row without a second
 * round-trip.
 */
export interface SiuProclamationSummary extends SiuProclamation {
  /** Number of stories linked through `siu_proclamation_stories`. */
  story_count?: number;
  /**
   * Headline `actual_recovered_rands` from the linked outcome row,
   * string-encoded to preserve bigint precision. Null when no outcome
   * row exists yet (active proclamations rarely have figures recorded).
   */
  recovered_rands?: string | null;
  /**
   * Outcome aggregates folded onto the summary so the editorial list view
   * can render the full "investigated · recovered · referrals · tribunal
   * cases" row without a per-row detail fan-out. Rand values are
   * string-encoded bigints (or null when no outcome row exists yet);
   * the three counts default to 0 in that case.
   */
  investigated_rands?: string | null;
  npa_referrals?: number;
  department_referrals?: number;
  tribunal_cases_filed?: number;
}

/**
 * Proclamation row for `LawSectionDetail.siu_proclamations` — the API uses
 * {@link SiuProclamationSummary} fields (same card shape as the SIU list).
 */
export interface SiuProclamationCitingSection {
  id: string;
  usage_type: SiuLawUsageType;
  relevance: string | null;
  proclamation: SiuProclamationSummary;
}

/** Mirrors `siu_investigation_outcome.entity.ts`. 1:1 with proclamation. */
export interface SiuInvestigationOutcome {
  id: string;
  proclamation_id: string;
  total_value_investigated: string | null;
  financial_losses_identified: string | null;
  actual_recovered_rands: string | null;
  losses_prevented_rands: string | null;
  civil_litigation_value_rands: string | null;
  contracts_set_aside_value: string | null;
  referrals_to_npa: number;
  referrals_to_hawks: number;
  referrals_to_departments: number;
  employees_referred_disciplinary: number;
  employees_dismissed: number;
  special_tribunal_cases_filed: number;
  outcome_summary: string | null;
  plain_english_outcome: string | null;
  report_submitted_date: string | null;
  report_url: string | null;
  created_at: string;
  updated_at: string;
}

/** Mirrors `special_tribunal.entity.ts`. Singleton court record. */
export interface SpecialTribunal {
  id: string;
  name: string;
  established_date: string;
  enabling_legislation: string;
  plain_english_summary: string;
  address: string | null;
  website_url: string | null;
  created_at: string;
}

/** Mirrors `special_tribunal_case.entity.ts`. */
export interface SpecialTribunalCase {
  id: string;
  proclamation_id: string;
  case_number: string;
  case_title: string;
  value_rands: string | null;
  respondents: string[];
  nature_of_claim: string;
  filed_date: string | null;
  status: TribunalCaseStatus;
  outcome_summary: string | null;
  amount_recovered_rands: string | null;
  judgment_date: string | null;
  judgment_url: string | null;
  plain_english_outcome: string | null;
}

/** Mirrors `siu_proclamation_person.entity.ts` joined onto {@link Person}. */
export interface SiuProclamationPerson {
  id: string;
  proclamation_id: string;
  person_id: string;
  full_name: string;
  current_role: string | null;
  organisation: string | null;
  person_status: PersonStatus;
  role: SiuPersonRole;
  summary: string | null;
}

/** Brief story row returned in the proclamation detail view. */
export interface SiuProclamationStoryBrief {
  id: string;
  title: string;
  slug: string;
  domain: string;
  status: string;
  summary: string | null;
  latest_event_date: string | null;
}

/** Compact paired-commission card returned with a proclamation. */
export interface SiuRelatedCommission {
  id: string;
  popular_name: string;
  slug: string;
  domain: CommissionDomain;
  status: CommissionStatus;
  chair_name: string;
  produced_prosecutions: boolean | null;
  announced_date: string | null;
  concluded_date: string | null;
}

/** Compact paired-committee card returned with a proclamation. */
export interface SiuRelatedAdhocCommittee {
  id: string;
  popular_name: string;
  slug: string;
  domain: CommissionDomain;
  status: AdhocCommitteeStatus;
  category: AdhocCommitteeCategory;
  chair_name: string | null;
  parliament_term: string | null;
  announced_date: string | null;
}

/** Aggregate stats payload — `GET /api/siu/stats` and `/api/siu`. */
export interface SiuStats {
  total_proclamations: number;
  active_proclamations_count: number;
  concluded_proclamations_count: number;
  /** Bigint Rand values are string-encoded — see module note above. */
  total_investigated_rands: string;
  total_recovered_rands: string;
  total_prevented_rands: string;
  total_civil_litigation_rands: string;
  total_npa_referrals: number;
  total_hawks_referrals: number;
  total_department_referrals: number;
  total_employees_dismissed: number;
  total_tribunal_cases: number;
}

/** Response shape of `GET /api/siu`. */
export interface SiuOverviewResponse {
  body: SiuBody;
  stats: SiuStats;
}

/** Grouped `siu_proclamation_law_sections` on proclamation detail. */
export interface SiuProclamationLawSectionsByUsage {
  enabling: SiuProclamationLawSectionItem[];
  investigated: SiuProclamationLawSectionItem[];
  violated: SiuProclamationLawSectionItem[];
  recovered_under: SiuProclamationLawSectionItem[];
}

export interface SiuProclamationLawSectionItem {
  id: string;
  usage_type: SiuLawUsageType;
  relevance: string | null;
  law_section: (LawSection & { law: Law }) | null;
  constitution_section: ConstitutionSection | null;
}

/** Response shape of `GET /api/siu/proclamations/:slug`. */
export interface SiuProclamationDetail extends SiuProclamationSummary {
  outcome: SiuInvestigationOutcome | null;
  tribunal_cases: SpecialTribunalCase[];
  stories: SiuProclamationStoryBrief[];
  people: SiuProclamationPerson[];
  related_commission: SiuRelatedCommission | null;
  related_adhoc_committee: SiuRelatedAdhocCommittee | null;
  law_sections_by_usage: SiuProclamationLawSectionsByUsage;
}

/**
 * `GET /api/siu/proclamations` is paginated. The web layer wraps the
 * response in its local `Paginated<T>` envelope (see `apps/web/lib/api.ts`),
 * matching how stories / commissions / committees lists are typed —
 * there is no `SiuProclamationListResponse` export here on purpose.
 */

/** Response shape of `GET /api/siu/tribunal`. */
export interface SpecialTribunalOverviewResponse {
  tribunal: SpecialTribunal;
  cases: SpecialTribunalCase[];
  total: number;
}

/** Response shape of `GET /api/siu/tribunal/:caseNumber`. */
export interface SpecialTribunalCaseDetail extends SpecialTribunalCase {
  proclamation: SiuProclamationSummary;
}

// -----------------------------------------------------------------------------
// Person detail — GET /api/people/:id
// -----------------------------------------------------------------------------

/** A lightweight list item returned by `GET /api/people` — and the base of `PersonDetail`. */
export type PersonSummary = Person;

/** One story this person is named in, as surfaced on the person profile. */
export interface PersonStoryAppearance {
  id: string;
  title: string;
  slug: string;
  domain: StoryDomain;
  status: StoryStatus;
  role_in_story: string;
  is_key_figure: boolean;
}

/**
 * One commission role this person holds. A single person can hold several
 * rows for the same commission (witness → implicated, etc.) — so this is a
 * `(commission × role)` pair, not a deduplicated commission.
 */
export interface PersonCommissionAppearance {
  id: string;
  commission_id: string;
  popular_name: string;
  full_name: string;
  slug: string;
  domain: CommissionDomain;
  status: CommissionStatus;
  role: CommissionPersonRole;
  summary: string | null;
  chair_name: string;
  announced_date: string | null;
  concluded_date: string | null;
  report_released_date: string | null;
  produced_prosecutions: boolean | null;
}

/** A timeline event that came from one of this person's stories. */
export interface PersonEventAppearance {
  id: string;
  story_id: string;
  event_date: string;
  event_type: EventType;
  title: string;
  significance: EventSignificance;
}

/** Response shape of `GET /api/people/:id`. */
export interface PersonDetail extends Person {
  stories: PersonStoryAppearance[];
  commissions: PersonCommissionAppearance[];
  events: PersonEventAppearance[];
}

// -----------------------------------------------------------------------------
// Ingestion — POST /api/ingestion/article
//
// The ingestion pipeline chains:
//   NER (spaCy) → legal mapping → story clustering (or creation) →
//   person upsert + story linking → article persist → optional simplify.
// These shapes mirror the DTOs in `apps/api/src/ingestion/dto/*` so the web
// app (or any downstream consumer) can type the trace response without
// redeclaring it.
// -----------------------------------------------------------------------------

export type IntelligenceReadingLevel = "child" | "layperson" | "legal";

export interface IntelligencePersonEntity {
  name: string;
  role: string | null;
  confidence: number;
}

export interface IntelligenceOrganisationEntity {
  name: string;
  type: string | null;
}

export interface IntelligenceEventEntity {
  type: string;
  date_mentioned: string | null;
  description: string;
}

/** Full payload returned by the intelligence `POST /api/entities/extract`. */
export interface IntelligenceExtractResult {
  people: IntelligencePersonEntity[];
  organisations: IntelligenceOrganisationEntity[];
  events: IntelligenceEventEntity[];
  crimes_alleged: string[];
  locations: string[];
}

export interface IntelligenceLegalReference {
  act_name: string;
  short_name: string;
  section: string;
  relevance: string;
  is_constitutional: boolean;
  act_number: string | null;
}

export interface IntelligenceClusterResult {
  matched_story_id: string | null;
  confidence: number;
  reasoning: string;
}

export interface IntelligenceSimplifyResult {
  simplified: string;
  reading_level: IntelligenceReadingLevel;
}

/** Request shape for POST /api/ingestion/article. */
export interface IngestArticleRequest {
  headline: string;
  source_name: string;
  source_url: string;
  /** ISO-8601 date-time. */
  published_at: string;
  /** Fair-use excerpt only — hard capped at 500 characters in the DB. */
  content_snippet: string;
  /** The NLP corpus. Never persisted. */
  full_text: string;
  /** When set, clustering is skipped and the article is bound to this story. */
  story_id_hint?: string;
  /** When true, Claude will generate the story's plain_english_summary. */
  simplify_summary?: boolean;
  /** Used only when clustering fails and a new story must be created. */
  default_domain?: StoryDomain;
}

export interface IngestedPerson {
  person_id: string;
  full_name: string;
  /** Every raw spelling NER produced that resolved to this person. */
  seen_as: string[];
  was_created: boolean;
  was_linked_to_story: boolean;
}

export interface IngestionStoryDecision {
  story_id: string;
  story_slug: string;
  story_title: string;
  story_domain: StoryDomain;
  story_status: StoryStatus;
  was_created: boolean;
  cluster: IntelligenceClusterResult | null;
}

export interface IngestionResult {
  article_id: string;
  story: IngestionStoryDecision;
  entities: IntelligenceExtractResult;
  legal_references: IntelligenceLegalReference[];
  people: IngestedPerson[];
  simplify: IntelligenceSimplifyResult | null;
  warnings: string[];
}

export interface SimplifyLawSectionResult {
  law_section_id: string;
  previous_plain_english: string | null;
  simplified: string;
  reading_level: IntelligenceReadingLevel;
}

// -----------------------------------------------------------------------------
// Global search (`GET /api/search`)
// -----------------------------------------------------------------------------

/**
 * Result kinds returned from {@link SearchResponse}. Aligned with
 * `search-result.dto` in the Nest API.
 */
export type SearchResultType =
  | "story"
  | "person"
  | "commission"
  | "committee"
  | "siu"
  | "law"
  | "law_section"
  | "province"
  | "municipality";

/**
 * A single match from the global search endpoint — one row in the
 * type-blended, paginated list.
 */
export interface SearchResult {
  type: SearchResultType;
  id: string;
  /** Primary line (title, name, or heading). */
  name: string;
  /** Secondary line: role, act number, domain chip text, etc. */
  subtitle: string;
  slug?: string;
  status?: string;
  domain?: string;
  /** In-app path (starts with `/`). */
  url: string;
  /** Truncated plain-English line when the entity has one. */
  plain_english?: string;
}

/**
 * Envelope for `GET /api/search` — the merged, sorted, paginated view.
 */
export interface SearchResponse {
  query: string;
  /** Total matches before `limit` / `page` are applied. */
  total: number;
  results: SearchResult[];
}

// -----------------------------------------------------------------------------
// YouTube resources (`GET /api/youtube/...`)
// -----------------------------------------------------------------------------

export type YoutubeVideoReviewStatus = "pending" | "approved" | "rejected";

export type YoutubeVideoType =
  | "news_report"
  | "parliamentary"
  | "commission_hearing"
  | "documentary"
  | "analysis"
  | "interview"
  | "other";

/** Mirrors `youtube-video.entity.ts` — public list/detail projection. */
export interface YoutubeVideo {
  id: string;
  youtube_id: string;
  title: string;
  channel_name: string | null;
  channel_id: string | null;
  description: string | null;
  published_at: string | null;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  /** Decimal string from API (`bigint` view_count). */
  view_count: string | null;
  relevance_score: number;
  relevance_reason: string | null;
  status: YoutubeVideoReviewStatus;
  video_type: YoutubeVideoType;
  language: string;
  commission_id: string | null;
  adhoc_committee_id: string | null;
  story_id: string | null;
  siu_proclamation_id: string | null;
  created_at: string;
  updated_at: string;
}
