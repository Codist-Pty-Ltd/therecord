import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import {
  AdhocCommitteeCategory,
  AdhocCommitteeStatus,
} from '../../entities/adhoc_committee.entity';
import { AdhocCommitteeLawSectionUsage } from '../../entities/adhoc_committee_law_section.entity';
import { AdhocCommitteePersonRole } from '../../entities/adhoc_committee_person.entity';
import {
  CommissionDomain,
  CommissionStatus,
} from '../../entities/commission.entity';
import { PersonStatus } from '../../entities/person.entity';
import {
  EventSignificance,
  EventType,
} from '../../entities/timeline_event.entity';

// -----------------------------------------------------------------------------
// Flat committee summary (used by list endpoint + as base for detail)
// -----------------------------------------------------------------------------

export class AdhocCommitteeSummaryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() popular_name!: string;
  @ApiProperty() full_name!: string;
  @ApiProperty() slug!: string;

  @ApiPropertyOptional({ nullable: true }) parliament_term!: string | null;
  @ApiPropertyOptional({ nullable: true }) parliament_years!: string | null;

  @ApiProperty({ enum: CommissionDomain }) domain!: CommissionDomain;
  @ApiProperty({ enum: AdhocCommitteeCategory }) category!: AdhocCommitteeCategory;

  @ApiProperty() established_by!: string;
  @ApiPropertyOptional({ nullable: true }) enabling_provision!: string | null;
  @ApiProperty() is_joint_committee!: boolean;

  @ApiPropertyOptional({ nullable: true }) chair_name!: string | null;

  @ApiProperty() mandate_summary!: string;
  @ApiProperty() plain_english_summary!: string;

  @ApiPropertyOptional({ nullable: true, format: 'date' })
  announced_date!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'date' })
  first_meeting_date!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'date' })
  concluded_date!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'date' })
  report_adopted_date!: string | null;

  @ApiProperty({ enum: AdhocCommitteeStatus }) status!: AdhocCommitteeStatus;
  @ApiPropertyOptional({ nullable: true }) outcome_summary!: string | null;
  @ApiPropertyOptional({ nullable: true }) produced_legislative_change!:
    | boolean
    | null;
  @ApiPropertyOptional({ nullable: true }) produced_accountability_action!:
    | boolean
    | null;

  @ApiPropertyOptional({ nullable: true }) report_url!: string | null;
  @ApiPropertyOptional({ nullable: true }) parliament_url!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    format: 'uuid',
    description:
      'If the committee sits alongside a commission of inquiry, the commission id.',
  })
  related_commission_id!: string | null;

  @ApiProperty({ format: 'date-time' }) created_at!: string;
  @ApiProperty({ format: 'date-time' }) updated_at!: string;

  /** Denormalised story count, populated at read-time for the list view. */
  @ApiPropertyOptional({
    nullable: true,
    description: 'Number of stories linked to this committee.',
  })
  story_count?: number;
}

// -----------------------------------------------------------------------------
// Nested types (detail view)
// -----------------------------------------------------------------------------

export class AdhocCommitteeStoryBriefDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() domain!: string;
  @ApiProperty() status!: string;
  @ApiPropertyOptional({ nullable: true }) summary!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'date' })
  latest_event_date!: string | null;
}

export class AdhocCommitteePersonBriefDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) adhoc_committee_id!: string;
  @ApiProperty({ format: 'uuid' }) person_id!: string;
  @ApiProperty() full_name!: string;
  @ApiPropertyOptional({ nullable: true }) current_role!: string | null;
  @ApiPropertyOptional({ nullable: true }) organisation!: string | null;
  @ApiProperty({ enum: PersonStatus }) person_status!: PersonStatus;
  @ApiProperty({ enum: AdhocCommitteePersonRole }) role!: AdhocCommitteePersonRole;
  @ApiPropertyOptional({ nullable: true }) party_affiliation!: string | null;
  @ApiPropertyOptional({ nullable: true }) summary!: string | null;
}

export class AdhocCommitteeLawSectionBriefDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) adhoc_committee_id!: string;
  @ApiProperty({ format: 'uuid' }) law_section_id!: string;
  @ApiProperty({ enum: AdhocCommitteeLawSectionUsage })
  usage_type!: AdhocCommitteeLawSectionUsage;
  @ApiProperty() section_number!: string;
  @ApiProperty() section_title!: string;
  @ApiProperty() plain_english!: string;
  @ApiProperty() law_name!: string;
  @ApiProperty() law_short_name!: string;
}

export class AdhocCommitteeTimelineEventDto {
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

/**
 * Compact representation of the paired commission — a subset of the full
 * commission entity, just enough to render a "See also: executive inquiry"
 * card on the committee page without a second API round-trip.
 */
export class AdhocCommitteeRelatedCommissionDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() popular_name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ enum: CommissionDomain }) domain!: CommissionDomain;
  @ApiProperty({ enum: CommissionStatus }) status!: CommissionStatus;
  @ApiProperty() chair_name!: string;
  @ApiPropertyOptional({ nullable: true }) produced_prosecutions!: boolean | null;
  @ApiPropertyOptional({ nullable: true, format: 'date' })
  announced_date!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'date' })
  concluded_date!: string | null;
}

// -----------------------------------------------------------------------------
// Detail + list wrappers
//
// NOTE: grouping DTOs (PeopleByRole / LawSectionsByUsage) are declared BEFORE
// the detail wrapper on purpose — TS `emitDecoratorMetadata: true` emits a
// runtime `design:type` reference for every decorated property, so the
// referenced class must be initialised first or Node throws
// `ReferenceError: Cannot access X before initialization`.
// -----------------------------------------------------------------------------

export class AdhocCommitteePeopleByRoleDto {
  @ApiProperty({ type: [AdhocCommitteePersonBriefDto] })
  chair!: AdhocCommitteePersonBriefDto[];
  @ApiProperty({ type: [AdhocCommitteePersonBriefDto] })
  member!: AdhocCommitteePersonBriefDto[];
  @ApiProperty({ type: [AdhocCommitteePersonBriefDto] })
  witness!: AdhocCommitteePersonBriefDto[];
  @ApiProperty({ type: [AdhocCommitteePersonBriefDto] })
  implicated!: AdhocCommitteePersonBriefDto[];
  @ApiProperty({ type: [AdhocCommitteePersonBriefDto] })
  legal_rep!: AdhocCommitteePersonBriefDto[];
  @ApiProperty({ type: [AdhocCommitteePersonBriefDto] })
  secretary!: AdhocCommitteePersonBriefDto[];
}

export class AdhocCommitteeLawSectionsByUsageDto {
  @ApiProperty({ type: [AdhocCommitteeLawSectionBriefDto] })
  enabling!: AdhocCommitteeLawSectionBriefDto[];
  @ApiProperty({ type: [AdhocCommitteeLawSectionBriefDto] })
  investigated!: AdhocCommitteeLawSectionBriefDto[];
  @ApiProperty({ type: [AdhocCommitteeLawSectionBriefDto] })
  amended!: AdhocCommitteeLawSectionBriefDto[];
  @ApiProperty({ type: [AdhocCommitteeLawSectionBriefDto] })
  being_processed!: AdhocCommitteeLawSectionBriefDto[];
}

export class AdhocCommitteeDetailResponseDto extends AdhocCommitteeSummaryDto {
  @ApiProperty({ type: [AdhocCommitteeStoryBriefDto] })
  stories!: AdhocCommitteeStoryBriefDto[];

  @ApiProperty({
    description: 'Committee members + witnesses grouped by role.',
    type: AdhocCommitteePeopleByRoleDto,
  })
  people!: AdhocCommitteePeopleByRoleDto;

  @ApiProperty({
    description: 'Law sections grouped by usage_type.',
    type: AdhocCommitteeLawSectionsByUsageDto,
  })
  law_sections!: AdhocCommitteeLawSectionsByUsageDto;

  @ApiPropertyOptional({
    nullable: true,
    type: AdhocCommitteeRelatedCommissionDto,
    description:
      'Populated only when the committee sits alongside a commission on the same matter.',
  })
  related_commission!: AdhocCommitteeRelatedCommissionDto | null;

  @ApiProperty({
    type: [AdhocCommitteeTimelineEventDto],
    description:
      'Unified timeline reconstructed from every linked story, ordered by event_date ASC.',
  })
  timeline!: AdhocCommitteeTimelineEventDto[];
}

export class AdhocCommitteeListResponseDto {
  @ApiProperty({ type: [AdhocCommitteeSummaryDto] })
  data!: AdhocCommitteeSummaryDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

/**
 * Response for `GET /adhoc-committees/by-parliament/:term`. Unpaginated —
 * there are never more than a couple of dozen ad hoc committees per
 * Parliament, so this is small enough to return in one hit.
 */
export class AdhocCommitteesByParliamentResponseDto {
  @ApiProperty({
    example: '7th Parliament',
    description: 'The canonical parliament_term value used in the filter.',
  })
  parliament_term!: string;

  @ApiProperty({ type: [AdhocCommitteeSummaryDto] })
  data!: AdhocCommitteeSummaryDto[];

  @ApiProperty({ example: 12 })
  total!: number;
}
