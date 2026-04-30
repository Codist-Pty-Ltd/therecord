import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

import {
  AccountabilityBodyStatus,
  AccountabilityBodyType,
} from '../../entities/accountability-body.entity';
import {
  AccountabilityBodyCaseOutcome,
  AccountabilityBodyCaseSignificance,
} from '../../entities/accountability-body-case.entity';
import {
  EventSignificance,
  EventType,
} from '../../entities/timeline_event.entity';

// -----------------------------------------------------------------------------
// Query DTOs
// -----------------------------------------------------------------------------

export class AccountabilityBodyListQueryDto {
  @ApiPropertyOptional({ enum: AccountabilityBodyStatus })
  @IsOptional()
  @IsEnum(AccountabilityBodyStatus)
  status?: AccountabilityBodyStatus;

  @ApiPropertyOptional({ enum: AccountabilityBodyType })
  @IsOptional()
  @IsEnum(AccountabilityBodyType)
  body_type?: AccountabilityBodyType;
}

export class AccountabilityBodyCasesQueryDto {
  @ApiPropertyOptional({ enum: AccountabilityBodyCaseOutcome })
  @IsOptional()
  @IsEnum(AccountabilityBodyCaseOutcome)
  outcome?: AccountabilityBodyCaseOutcome;

  @ApiPropertyOptional({ enum: AccountabilityBodyCaseSignificance })
  @IsOptional()
  @IsEnum(AccountabilityBodyCaseSignificance)
  significance?: AccountabilityBodyCaseSignificance;

  @ApiPropertyOptional({
    enum: ['value_rands_desc', 'case_year_start_asc'],
    default: 'case_year_start_asc',
    description:
      'value_rands_desc — null amounts sort last; case_year_start_asc — chronological.',
  })
  @IsOptional()
  @IsIn(['value_rands_desc', 'case_year_start_asc'])
  sort?: 'value_rands_desc' | 'case_year_start_asc';
}

export class AccountabilityBodiesCompareQueryDto {
  @ApiProperty({
    example: 'scorpions-dso,hawks-dpci,idac',
    description: 'Comma-separated body slugs (2–10).',
  })
  @IsString()
  @MaxLength(500)
  @Matches(/^[a-z0-9-]+(?:,[a-z0-9-]+)*$/i, {
    message: 'bodies must be one or more comma-separated slugs.',
  })
  bodies!: string;
}

// -----------------------------------------------------------------------------
// Embedded / shared shapes (commissions, stories, detail)
// -----------------------------------------------------------------------------

/** Compact embed for commissions.subject_body and story relations. */
export class AccountabilityBodyEmbedDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() popular_name!: string;
  @ApiProperty() abbreviation!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: AccountabilityBodyType }) body_type!: AccountabilityBodyType;
  @ApiProperty({ enum: AccountabilityBodyStatus }) status!: AccountabilityBodyStatus;
  @ApiProperty() mandate_summary!: string;
  @ApiPropertyOptional({ nullable: true }) legacy_summary!: string | null;
}

/** Brief row for commissions that investigated this body. */
export class AccountabilityBodyRelatedCommissionDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() popular_name!: string;
  @ApiProperty() full_name!: string;
  @ApiProperty() status!: string;
  @ApiPropertyOptional({ nullable: true })
  outcome_summary!: string | null;
}

export class AccountabilityBodyLinkedStoryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() domain!: string;
  @ApiProperty() status!: string;
  @ApiPropertyOptional({ nullable: true }) summary!: string | null;
}

export class AccountabilityBodyComparisonContextDto {
  @ApiPropertyOptional({ type: AccountabilityBodyEmbedDto, nullable: true })
  successor!: AccountabilityBodyEmbedDto | null;

  @ApiPropertyOptional({ type: AccountabilityBodyEmbedDto, nullable: true })
  predecessor!: AccountabilityBodyEmbedDto | null;

  @ApiProperty({
    type: [String],
    description: 'Suggested peer slugs for compare-UIs (e.g. Scorpions ↔ Hawks ↔ IDAC).',
  })
  peer_slugs!: string[];
}

// -----------------------------------------------------------------------------
// Case + list/detail response
// -----------------------------------------------------------------------------

export class AccountabilityBodyCaseResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) body_id!: string;
  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  story_id!: string | null;
  @ApiProperty() case_name!: string;
  @ApiProperty({ type: [String] }) accused_names!: string[];
  @ApiPropertyOptional({ nullable: true }) charge_summary!: string | null;
  @ApiProperty() case_year_start!: number;
  @ApiPropertyOptional({ nullable: true }) case_year_end!: number | null;
  @ApiProperty({ enum: AccountabilityBodyCaseOutcome }) outcome!: AccountabilityBodyCaseOutcome;
  @ApiPropertyOptional({ nullable: true }) outcome_detail!: string | null;
  @ApiProperty({ enum: AccountabilityBodyCaseSignificance })
  significance!: AccountabilityBodyCaseSignificance;
  @ApiPropertyOptional({ nullable: true, description: 'Whole rands as string (bigint).' })
  value_rands!: string | null;
  @ApiPropertyOptional({ nullable: true }) plain_english!: string | null;
  @ApiProperty({ type: [String] }) law_sections_applied!: string[];
  @ApiProperty({ format: 'date-time' }) created_at!: string;
}

/** Full row for list + detail base — mirrors entity for API consumers. */
export class AccountabilityBodyResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() popular_name!: string;
  @ApiProperty() abbreviation!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ enum: AccountabilityBodyType }) body_type!: AccountabilityBodyType;
  @ApiPropertyOptional({ nullable: true }) parent_organisation!: string | null;
  @ApiPropertyOptional({ nullable: true }) enabling_legislation!: string | null;
  @ApiPropertyOptional({ nullable: true }) constitution_section!: string | null;
  @ApiProperty({ enum: AccountabilityBodyStatus }) status!: AccountabilityBodyStatus;
  @ApiProperty({ format: 'date' }) established_date!: string;
  @ApiPropertyOptional({ nullable: true, format: 'date' }) announced_date!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'date' }) operational_date!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'date' }) disbanded_date!: string | null;
  @ApiPropertyOptional({ nullable: true }) replaced_by!: string | null;
  @ApiPropertyOptional({ nullable: true }) disbanded_reason!: string | null;
  @ApiProperty() mandate_summary!: string;
  @ApiProperty() plain_english_summary!: string;
  @ApiProperty() plain_english_child!: string;
  @ApiPropertyOptional({ nullable: true }) tactics!: string | null;
  @ApiPropertyOptional({ nullable: true }) distinguishing_features!: string | null;
  @ApiPropertyOptional({
    nullable: true,
    type: 'array',
    items: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        title: { type: 'string' },
        period_start: { type: 'string', nullable: true },
        period_end: { type: 'string', nullable: true },
      },
    },
  })
  leadership_history!: {
    name: string;
    title: string;
    period_start: string | null;
    period_end: string | null;
  }[] | null;
  @ApiPropertyOptional({ nullable: true }) total_investigations!: number | null;
  @ApiPropertyOptional({ nullable: true }) total_prosecutions!: number | null;
  @ApiPropertyOptional({ nullable: true }) total_convictions!: number | null;
  @ApiPropertyOptional({ nullable: true, description: 'decimal(5,2) as API string' })
  conviction_rate_percentage!: string | null;
  @ApiPropertyOptional({ nullable: true }) total_arrests!: number | null;
  @ApiPropertyOptional({ nullable: true, description: 'bigint as string' })
  assets_seized_rands!: string | null;
  @ApiPropertyOptional({ nullable: true, description: 'bigint as string' })
  financial_losses_recovered_rands!: string | null;
  @ApiPropertyOptional({ nullable: true }) cases_transferred_on_dissolution!: number | null;
  @ApiPropertyOptional({ nullable: true }) staff_count_at_peak!: number | null;
  @ApiPropertyOptional({ nullable: true, description: 'bigint as string' })
  annual_budget_rands!: string | null;
  @ApiPropertyOptional({ nullable: true }) legacy_summary!: string | null;
  @ApiPropertyOptional({ nullable: true }) cases_outcome_after_transfer!: string | null;
  @ApiPropertyOptional({ nullable: true }) was_political_disbanding!: boolean | null;
  @ApiPropertyOptional({ nullable: true }) political_disbanding_evidence!: string | null;
  @ApiProperty({ format: 'date-time' }) created_at!: string;
  @ApiProperty({ format: 'date-time' }) updated_at!: string;
}

export class AccountabilityBodyDetailDto extends AccountabilityBodyResponseDto {
  @ApiProperty({ type: [AccountabilityBodyCaseResponseDto] })
  cases!: AccountabilityBodyCaseResponseDto[];

  @ApiProperty({
    type: [AccountabilityBodyRelatedCommissionDto],
    description: 'Commissions whose subject_body is this unit (e.g. Khampepe → Scorpions).',
  })
  related_commissions!: AccountabilityBodyRelatedCommissionDto[];

  @ApiProperty({ type: [AccountabilityBodyLinkedStoryDto] })
  linked_stories!: AccountabilityBodyLinkedStoryDto[];

  @ApiProperty({ type: AccountabilityBodyComparisonContextDto })
  comparison!: AccountabilityBodyComparisonContextDto;
}

export class AccountabilityBodyCasesListResponseDto {
  @ApiProperty({ type: [AccountabilityBodyCaseResponseDto] })
  data!: AccountabilityBodyCaseResponseDto[];
}

export class AccountabilityBodyCompareRowDto {
  @ApiProperty() name!: string;
  @ApiProperty() abbreviation!: string;
  @ApiProperty({ enum: AccountabilityBodyStatus }) status!: AccountabilityBodyStatus;
  @ApiPropertyOptional({ nullable: true }) conviction_rate_percentage!: string | null;
  @ApiPropertyOptional({ nullable: true }) total_investigations!: number | null;
  @ApiPropertyOptional({ nullable: true }) total_convictions!: number | null;
  @ApiPropertyOptional({ nullable: true, description: 'bigint as string' })
  assets_seized_rands!: string | null;
  @ApiPropertyOptional({ nullable: true }) parent_organisation!: string | null;
  @ApiPropertyOptional({
    nullable: true,
    description: 'Approximate years between operational_date and disbanded_date (or today if active).',
  })
  years_active!: number | null;
  @ApiPropertyOptional({ nullable: true }) was_political_disbanding!: boolean | null;
}

export class AccountabilityBodyCompareResponseDto {
  @ApiProperty({ type: [AccountabilityBodyCompareRowDto] })
  bodies!: AccountabilityBodyCompareRowDto[];
}

export class AccountabilityBodyTimelineEventDto {
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

export class AccountabilityBodyTimelineResponseDto {
  @ApiProperty({ type: [AccountabilityBodyTimelineEventDto] })
  events!: AccountabilityBodyTimelineEventDto[];
}
