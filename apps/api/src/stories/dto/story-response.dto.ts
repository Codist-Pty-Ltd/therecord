import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import { AccountabilityBodyEmbedDto } from '../../accountability-bodies/dto/accountability-body.dto';
import {
  EventSignificance,
  EventType,
} from '../../entities/timeline_event.entity';
import {
  InvestigationStatus,
  InvestigationType,
} from '../../entities/investigation.entity';
import { LawCategory } from '../../entities/law.entity';
import { MunicipalityType } from '../../entities/municipality.entity';
import { PersonStatus } from '../../entities/person.entity';
import {
  AmountQualifier,
  ExpenditureSector,
  ExpenditureType,
} from '../../entities/public-expenditure-record.entity';
import { SimilarityReason } from '../../entities/similar-story.entity';
import { StoryDomain, StoryStatus, StoryCategory } from '../../entities/story.entity';

/* ------------------------------------------------------------------ list */

export class StoryListItemDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ enum: StoryDomain }) domain!: StoryDomain;
  @ApiProperty({ enum: StoryStatus }) status!: StoryStatus;
  @ApiPropertyOptional({ nullable: true }) summary!: string | null;
  @ApiPropertyOptional({ nullable: true }) plain_english_summary!: string | null;
  @ApiPropertyOptional({
    nullable: true,
    format: 'uuid',
    description: 'When set, links the story to a commission of inquiry. Null for standalone stories.',
  })
  commission_id!: string | null;
  @ApiPropertyOptional({
    nullable: true,
    format: 'uuid',
    description: 'Parliamentary ad hoc committee scope, when applicable.',
  })
  adhoc_committee_id!: string | null;
  @ApiPropertyOptional({
    nullable: true,
    format: 'uuid',
    description: 'SIU proclamation scope, when applicable.',
  })
  siu_proclamation_id!: string | null;
  @ApiPropertyOptional({
    nullable: true,
    format: 'uuid',
    description:
      'Accountability body scope (Scorpions, Hawks, IDAC, AFU, etc.), when applicable.',
  })
  accountability_body_id!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  province_id!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  municipality_id!: string | null;
  @ApiPropertyOptional({ enum: StoryCategory, nullable: true })
  story_category!: StoryCategory | null;
  @ApiPropertyOptional({
    nullable: true,
    description: 'Cached sum of expenditure records (whole rands, string for bigint).',
  })
  total_amount_rands!: string | null;
  @ApiPropertyOptional({
    nullable: true,
    description: 'Most recent timeline event date (YYYY-MM-DD). Null when the story has no events.',
  })
  latest_event_date!: string | null;
  @ApiProperty({ format: 'date-time' }) created_at!: string;
  @ApiProperty({ format: 'date-time' }) updated_at!: string;
}

export class StoryListResponseDto {
  @ApiProperty({ type: [StoryListItemDto] }) data!: StoryListItemDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}

/* ------------------------------------------------------------- nested bits */

/**
 * Mirror of the `Person` entity. Used nested inside `StoryPersonBriefDto` so
 * the frontend can render a full person card from a single story-detail
 * response without a second roundtrip.
 */
export class PersonBriefDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() full_name!: string;
  @ApiProperty({ type: [String] }) aliases!: string[];
  @ApiPropertyOptional({ nullable: true }) current_role!: string | null;
  @ApiPropertyOptional({ nullable: true }) organisation!: string | null;
  @ApiProperty({ enum: PersonStatus }) status!: PersonStatus;
  @ApiPropertyOptional({ nullable: true }) profile_summary!: string | null;
  @ApiProperty({ format: 'date-time' }) created_at!: string;
  @ApiProperty({ format: 'date-time' }) updated_at!: string;
}

export class StoryPersonBriefDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) story_id!: string;
  @ApiProperty({ format: 'uuid' }) person_id!: string;
  @ApiProperty() role_in_story!: string;
  @ApiProperty() is_key_figure!: boolean;
  @ApiProperty({ type: PersonBriefDto }) person!: PersonBriefDto;
}

/**
 * Denormalised "resolved legal reference" attached to a timeline event.
 * The API flattens `event_legal_references → law_section → law` (or
 * `constitution_section`) into this single shape so the frontend doesn't
 * have to walk relations.
 */
export class LegalReferenceBriefDto {
  @ApiProperty() act_name!: string;
  @ApiProperty() short_name!: string;
  @ApiProperty() section!: string;
  @ApiProperty() relevance!: string;
  @ApiProperty() is_constitutional!: boolean;
  @ApiPropertyOptional({ nullable: true }) act_number?: string | null;
  @ApiPropertyOptional({ nullable: true }) plain_english?: string | null;
}

export class TimelineEventBriefDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) story_id!: string;
  @ApiProperty({ format: 'date' }) event_date!: string;
  @ApiProperty({ enum: EventType }) event_type!: EventType;
  @ApiProperty() title!: string;
  @ApiProperty() description!: string;
  @ApiProperty() plain_english!: string;
  @ApiProperty({ enum: EventSignificance }) significance!: EventSignificance;
  @ApiProperty({ type: [String] }) source_urls!: string[];
  @ApiProperty({ format: 'date-time' }) created_at!: string;
  @ApiProperty({
    type: [LegalReferenceBriefDto],
    description: 'Resolved law / constitution references attached to this event.',
  })
  legal_references!: LegalReferenceBriefDto[];
}

export class InvestigationBriefDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) story_id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: InvestigationType }) investigation_type!: InvestigationType;
  @ApiProperty() established_by!: string;
  @ApiProperty() legal_basis!: string;
  @ApiPropertyOptional({ nullable: true }) chair_name!: string | null;
  @ApiProperty({ enum: InvestigationStatus }) status!: InvestigationStatus;
  @ApiPropertyOptional({ nullable: true }) official_url!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'date' }) started_at!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'date' }) concluded_at!: string | null;
}

export class ArticleBriefDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) story_id!: string;
  @ApiProperty() source_name!: string;
  @ApiProperty() source_url!: string;
  @ApiProperty() headline!: string;
  @ApiProperty({ format: 'date-time' }) published_at!: string;
  @ApiProperty({ maxLength: 500 }) content_snippet!: string;
  @ApiProperty() ai_processed!: boolean;
  @ApiProperty({ format: 'date-time' }) created_at!: string;
}

export class LawSectionBriefDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() section_number!: string;
  @ApiProperty() section_title!: string;
  @ApiProperty() plain_english!: string;
  @ApiProperty() law_name!: string;
  @ApiProperty() law_short_name!: string;
  @ApiProperty({ enum: LawCategory }) law_category!: LawCategory;
}

export class ProvinceBriefDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional({ nullable: true }) abbreviation!: string | null;
  @ApiPropertyOptional({ nullable: true }) capital!: string | null;
}

export class MunicipalityBriefForStoryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() short_name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ enum: MunicipalityType }) municipality_type!: MunicipalityType;
}

export class PublicExpenditureRecordBriefDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) story_id!: string;
  @ApiPropertyOptional({ nullable: true, format: 'uuid' }) province_id!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'uuid' }) municipality_id!: string | null;
  @ApiProperty() amount_rands!: string;
  @ApiProperty({ enum: AmountQualifier }) amount_qualifier!: AmountQualifier;
  @ApiProperty({ enum: ExpenditureType }) expenditure_type!: ExpenditureType;
  @ApiProperty({ enum: ExpenditureSector }) sector!: ExpenditureSector;
  @ApiProperty() description!: string;
  @ApiPropertyOptional({ nullable: true }) plain_english!: string | null;
  @ApiPropertyOptional({ nullable: true }) source_document!: string | null;
  @ApiPropertyOptional({ nullable: true }) source_url!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'date' }) reference_date!: string | null;
  @ApiProperty() is_verified!: boolean;
  @ApiProperty({
    description:
      'When false, excluded from the national money counter sum (story still lists the row).',
  })
  is_primary_record!: boolean;
  @ApiProperty({ format: 'date-time' }) created_at!: string;
  @ApiProperty({ format: 'date-time' }) updated_at!: string;
}

const SIMILAR_MATCH = ['explicit_table', 'fallback_province', 'fallback_category', 'fallback_recent'] as const;
export type SimilarStoryMatchType = (typeof SIMILAR_MATCH)[number];

export class SimilarStoryBriefDto {
  @ApiProperty() title!: string;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional({ nullable: true }) total_amount_rands!: string | null;
  @ApiPropertyOptional({ enum: SimilarityReason, description: 'Set when row comes from similar_stories table' })
  similarity_reason?: SimilarityReason;
  @ApiPropertyOptional({ nullable: true }) similarity_note?: string | null;
  @ApiProperty({ enum: SIMILAR_MATCH }) match_type!: SimilarStoryMatchType;
  @ApiPropertyOptional({ enum: StoryCategory, nullable: true })
  story_category?: StoryCategory | null;
  @ApiPropertyOptional({ nullable: true }) province_name?: string | null;
  @ApiPropertyOptional({ nullable: true }) province_slug?: string | null;
  @ApiPropertyOptional({ nullable: true }) province_abbreviation?: string | null;
}

/* ------------------------------------------------------------------ detail */

export class StoryDetailResponseDto extends StoryListItemDto {
  @ApiPropertyOptional({ type: AccountabilityBodyEmbedDto, nullable: true })
  accountability_body!: AccountabilityBodyEmbedDto | null;

  @ApiProperty({ type: [TimelineEventBriefDto] })
  timeline_events!: TimelineEventBriefDto[];

  @ApiProperty({ type: [StoryPersonBriefDto] })
  people!: StoryPersonBriefDto[];

  @ApiProperty({ type: [InvestigationBriefDto] })
  investigations!: InvestigationBriefDto[];

  @ApiProperty({ type: [ArticleBriefDto] })
  articles!: ArticleBriefDto[];

  @ApiProperty({
    type: [LawSectionBriefDto],
    description:
      'Distinct law sections referenced by any timeline event of this story, via event_legal_references.',
  })
  law_sections!: LawSectionBriefDto[];

  @ApiPropertyOptional({ type: ProvinceBriefDto, nullable: true })
  province!: ProvinceBriefDto | null;

  @ApiPropertyOptional({ type: MunicipalityBriefForStoryDto, nullable: true })
  municipality!: MunicipalityBriefForStoryDto | null;

  @ApiProperty({ type: [PublicExpenditureRecordBriefDto] })
  expenditure_records!: PublicExpenditureRecordBriefDto[];

  @ApiProperty({
    type: [SimilarStoryBriefDto],
    description: 'Up to 5 related threads — explicit links first, then province/category fallback.',
  })
  similar_stories!: SimilarStoryBriefDto[];
}
