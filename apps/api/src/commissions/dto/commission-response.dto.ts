import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CommissionDomain,
  CommissionStatus,
} from '../../entities/commission.entity';
import { CommissionLawSectionUsage } from '../../entities/commission_law_section.entity';
import { CommissionPersonRole } from '../../entities/commission_person.entity';
import {
  EventSignificance,
  EventType,
} from '../../entities/timeline_event.entity';
import { PersonStatus } from '../../entities/person.entity';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';

// -----------------------------------------------------------------------------
// Flat commission summary (used by list endpoint + as the base for detail)
// -----------------------------------------------------------------------------

export class CommissionSummaryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() popular_name!: string;
  @ApiProperty() full_name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ enum: CommissionDomain }) domain!: CommissionDomain;
  @ApiProperty() enabling_legislation!: string;
  @ApiProperty() constitution_section_invoked!: string;
  @ApiProperty() reason_summary!: string;
  @ApiProperty() plain_english_summary!: string;
  @ApiProperty() chair_name!: string;

  @ApiPropertyOptional({ nullable: true, format: 'date' })
  announced_date!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'date' })
  hearings_started!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'date' })
  concluded_date!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'date' })
  report_released_date!: string | null;

  @ApiProperty({ enum: CommissionStatus }) status!: CommissionStatus;
  @ApiPropertyOptional({ nullable: true }) official_url!: string | null;
  @ApiPropertyOptional({ nullable: true }) report_url!: string | null;

  /** Cost in ZAR cents is not tracked — this is the full rand figure as a
   *  numeric string (bigint -> string in TypeORM to preserve precision). */
  @ApiPropertyOptional({
    nullable: true,
    description: 'Total cost in ZAR, as a decimal string (bigint).',
  })
  cost_rands!: string | null;

  @ApiPropertyOptional({ nullable: true }) total_hearing_days!: number | null;
  @ApiPropertyOptional({ nullable: true }) outcome_summary!: string | null;
  @ApiPropertyOptional({ nullable: true }) produced_prosecutions!: boolean | null;
  @ApiPropertyOptional({ nullable: true }) president_who_established!: string | null;

  @ApiProperty({ format: 'date-time' }) created_at!: string;
  @ApiProperty({ format: 'date-time' }) updated_at!: string;

  /** Story count is denormalised at read-time for the list view. */
  @ApiPropertyOptional({
    nullable: true,
    description: 'Number of stories linked to this commission.',
  })
  story_count?: number;
}

// -----------------------------------------------------------------------------
// Nested types (detail view)
// -----------------------------------------------------------------------------

export class CommissionStoryBriefDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() domain!: string;
  @ApiProperty() status!: string;
  @ApiPropertyOptional({ nullable: true }) summary!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'date' })
  latest_event_date!: string | null;
}

export class CommissionPersonBriefDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) commission_id!: string;
  @ApiProperty({ format: 'uuid' }) person_id!: string;
  @ApiProperty() full_name!: string;
  @ApiPropertyOptional({ nullable: true }) current_role!: string | null;
  @ApiPropertyOptional({ nullable: true }) organisation!: string | null;
  @ApiProperty({ enum: PersonStatus }) person_status!: PersonStatus;
  @ApiProperty({ enum: CommissionPersonRole }) role!: CommissionPersonRole;
  @ApiPropertyOptional({ nullable: true }) summary!: string | null;
}

export class CommissionLawSectionBriefDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) commission_id!: string;
  @ApiProperty({ format: 'uuid' }) law_section_id!: string;
  @ApiProperty({ enum: CommissionLawSectionUsage }) usage_type!: CommissionLawSectionUsage;
  @ApiProperty() section_number!: string;
  @ApiProperty() section_title!: string;
  @ApiProperty() plain_english!: string;
  @ApiProperty() law_name!: string;
  @ApiProperty() law_short_name!: string;
}

export class CommissionTimelineEventDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) story_id!: string;
  @ApiProperty() story_title!: string;
  @ApiProperty() story_slug!: string;
  @ApiProperty({ format: 'date' }) event_date!: string;
  @ApiProperty({ enum: EventType }) event_type!: EventType;
  @ApiProperty() title!: string;
  @ApiProperty() description!: string;
  @ApiProperty() plain_english!: string;
  @ApiProperty({ enum: EventSignificance }) significance!: EventSignificance;
}

// -----------------------------------------------------------------------------
// Detail + list wrappers
//
// NOTE: `LawSectionsByUsageDto` is declared BEFORE `CommissionDetailResponseDto`
// on purpose. With `emitDecoratorMetadata: true`, TypeScript emits a runtime
// `design:type` reference for every decorated property — so the referenced
// class must be initialised before the class that references it, or Node
// throws `ReferenceError: Cannot access X before initialization`.
// -----------------------------------------------------------------------------

export class LawSectionsByUsageDto {
  @ApiProperty({ type: [CommissionLawSectionBriefDto] })
  enabling!: CommissionLawSectionBriefDto[];
  @ApiProperty({ type: [CommissionLawSectionBriefDto] })
  investigated!: CommissionLawSectionBriefDto[];
  @ApiProperty({ type: [CommissionLawSectionBriefDto] })
  violated!: CommissionLawSectionBriefDto[];
  @ApiProperty({ type: [CommissionLawSectionBriefDto] })
  recommended!: CommissionLawSectionBriefDto[];
}

export class CommissionDetailResponseDto extends CommissionSummaryDto {
  @ApiProperty({ type: [CommissionStoryBriefDto] })
  stories!: CommissionStoryBriefDto[];

  @ApiProperty({ type: [CommissionPersonBriefDto] })
  people!: CommissionPersonBriefDto[];

  @ApiProperty({
    description: 'Law sections grouped by usage_type. Each bucket holds its entries.',
    type: LawSectionsByUsageDto,
  })
  law_sections!: LawSectionsByUsageDto;

  @ApiProperty({
    type: [CommissionTimelineEventDto],
    description:
      'Unified timeline reconstructed from every linked story, ordered by event_date ASC.',
  })
  timeline!: CommissionTimelineEventDto[];
}

export class CommissionListResponseDto {
  @ApiProperty({ type: [CommissionSummaryDto] })
  data!: CommissionSummaryDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
