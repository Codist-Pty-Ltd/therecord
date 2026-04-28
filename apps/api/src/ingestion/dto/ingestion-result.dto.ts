import type {
  ClusterMatchResult,
  ExtractEntitiesResult,
  LegalReferenceResult,
  SimplifyResult,
} from '../../intelligence/dto/intelligence.dto';
import type { StoryDomain, StoryStatus } from '../../entities/story.entity';

/**
 * One person that was seen in the article text and is now linked to the
 * story via `story_people`. Returned per-ingest so the caller can tell
 * which rows were fresh creates vs. matches against existing profiles.
 *
 * `seen_as` carries every raw spelling NER produced that resolved to this
 * person (e.g. ["Nhlanhla Mkhwanazi", "Mkhwanazi", "Lt Gen Mkhwanazi"]).
 * Useful when an editor wants to backfill aliases on the Person row.
 */
export interface IngestedPersonDto {
  readonly person_id: string;
  readonly full_name: string;
  readonly seen_as: string[];
  readonly was_created: boolean;
  readonly was_linked_to_story: boolean;
}

/** Result of the cluster step — did we bind to an existing story, or open a new thread? */
export interface IngestionStoryDecisionDto {
  readonly story_id: string;
  readonly story_slug: string;
  readonly story_title: string;
  readonly story_domain: StoryDomain;
  readonly story_status: StoryStatus;
  /** `true` when a new story row was inserted by this ingest. */
  readonly was_created: boolean;
  /**
   * `null` when the caller supplied `story_id_hint` and clustering was
   * skipped. Otherwise the raw cluster output that drove the decision.
   */
  readonly cluster: ClusterMatchResult | null;
}

/** Full ingestion trace returned by POST /api/ingestion/article. */
export interface IngestionResultDto {
  readonly article_id: string;
  readonly story: IngestionStoryDecisionDto;
  readonly entities: ExtractEntitiesResult;
  readonly legal_references: LegalReferenceResult[];
  readonly people: IngestedPersonDto[];
  readonly simplify: SimplifyResult | null;
  /** Human-readable warnings — soft failures that didn't abort ingest. */
  readonly warnings: string[];
}

/** Result of the backfill utility — GET/POST /api/ingestion/simplify/law-section/:id. */
export interface SimplifyLawSectionResultDto {
  readonly law_section_id: string;
  readonly previous_plain_english: string | null;
  readonly simplified: string;
  readonly reading_level: SimplifyResult['reading_level'];
}
