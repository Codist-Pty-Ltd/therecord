/**
 * DTOs that mirror the Pydantic response models in
 * `apps/intelligence/models/responses.py`. Kept in this shape so the
 * wire format is the contract — if either side changes, both sides must.
 *
 * These are the *external* shape (what the FastAPI service returns over
 * HTTP). Callers inside the NestJS API consume them through
 * `IntelligenceClient` and should not construct them by hand.
 */

export type ReadingLevel = 'child' | 'layperson' | 'legal';

export interface ExtractedPerson {
  name: string;
  role: string | null;
  confidence: number;
}

export interface ExtractedOrganisation {
  name: string;
  type: string | null;
}

export interface ExtractedEvent {
  type: string;
  date_mentioned: string | null;
  description: string;
}

export interface ExtractEntitiesResult {
  people: ExtractedPerson[];
  organisations: ExtractedOrganisation[];
  events: ExtractedEvent[];
  crimes_alleged: string[];
  locations: string[];
}

export interface LegalReferenceResult {
  act_name: string;
  short_name: string;
  section: string;
  relevance: string;
  is_constitutional: boolean;
  act_number: string | null;
}

export interface LegalMapResult {
  references: LegalReferenceResult[];
}

export interface ClusterMatchResult {
  matched_story_id: string | null;
  confidence: number;
  reasoning: string;
}

export interface SimplifyResult {
  simplified: string;
  reading_level: ReadingLevel;
}

/**
 * Minimal shape of a story we send to the clustering endpoint. Matches the
 * fields `apps/intelligence/services/nlp_service.py::cluster_match` actually
 * reads (title is required; the rest improve the score when present).
 */
export interface StoryCandidate {
  id: string;
  title: string;
  summary?: string | null;
  plain_english_summary?: string | null;
  keywords?: string[];
}
