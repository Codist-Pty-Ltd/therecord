import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ImpactSeverity } from '../../entities/story-impact-sector.entity';

export class ImpactSeverityDistributionDto {
  @ApiProperty() critical!: number;
  @ApiProperty() high!: number;
  @ApiProperty() medium!: number;
  @ApiProperty() low!: number;
}

export class ImpactSectorListItemDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ nullable: true }) icon!: string | null;
  @ApiPropertyOptional({ nullable: true }) constitutional_right!: string | null;
  @ApiPropertyOptional({ nullable: true }) stat_headline!: string | null;
  @ApiPropertyOptional({ nullable: true }) stat_value!: string | null;
  @ApiPropertyOptional({ nullable: true }) stat_label!: string | null;
  @ApiProperty({ description: 'Distinct stories with a story_impact_sectors row for this lens' })
  story_count!: number;
  @ApiProperty({
    description:
      'Sum of primary expenditure amounts (counter-eligible) for stories linked to this sector via story_impact_sectors.',
  })
  total_amount_affected_rands!: number;
}

export class ImpactLinkedStoryBriefDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ type: [String], description: 'Causal chain for this story ↔ sector' })
  impact_chain!: string[];
  @ApiProperty({ enum: ImpactSeverity }) impact_severity!: ImpactSeverity;
  @ApiPropertyOptional({
    nullable: true,
    description: 'Allocated portion narrative (whole rands as string).',
  })
  amount_diverted_rands!: string | null;
  @ApiPropertyOptional({ nullable: true }) people_affected_estimate!: string | null;
  @ApiPropertyOptional({ nullable: true }) plain_english_impact!: string | null;
}

export class ImpactLinkedCommissionDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() popular_name!: string;
  @ApiProperty({ description: 'How this commission’s subject matter hits this sector' })
  impact_summary!: string;
}

export class ImpactSectorDetailDto extends ImpactSectorListItemDto {
  @ApiProperty() what_was_promised!: string;
  @ApiProperty() ground_reality!: string;
  @ApiProperty() plain_english_child!: string;
  @ApiPropertyOptional({ nullable: true }) stat_source!: string | null;
  @ApiPropertyOptional({ nullable: true }) stat_year!: string | null;
  @ApiProperty({ type: [ImpactLinkedStoryBriefDto] })
  linked_stories!: ImpactLinkedStoryBriefDto[];
  @ApiProperty({ type: [ImpactLinkedCommissionDto] })
  linked_commissions!: ImpactLinkedCommissionDto[];
  @ApiProperty({
    description:
      'Same as total_amount_affected_rands — primary expenditure summed for linked stories.',
  })
  total_money_tracked_rands!: number;
  @ApiProperty({
    type: [String],
    description: 'Distinct non-null what_it_should_have_funded paragraphs from linked expenditure rows.',
  })
  what_it_should_have_funded_lines!: string[];
  @ApiProperty({ description: 'Newline-joined narrative block for UI' })
  what_it_should_have_funded_combined!: string;
}

export class ImpactWebSectorNodeDto {
  @ApiProperty() slug!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ nullable: true }) icon!: string | null;
  @ApiPropertyOptional({ nullable: true }) stat_value!: string | null;
  @ApiPropertyOptional({ nullable: true }) stat_label!: string | null;
  @ApiProperty() story_count!: number;
  @ApiProperty() total_rands_affected!: number;
  @ApiProperty({ type: ImpactSeverityDistributionDto })
  severity_distribution!: ImpactSeverityDistributionDto;
}

export class ImpactConnectionDto {
  @ApiProperty() from_sector!: string;
  @ApiProperty() to_sector!: string;
  @ApiProperty() connection_note!: string;
  @ApiProperty({ description: 'Stories where both sectors appear in story_impact_sectors' })
  story_count!: number;
}

export class NationalStatsDto {
  @ApiProperty({ description: 'People below lower-bound poverty line (~R1,300/person/month)' })
  poverty_headcount!: number;
  @ApiProperty({ description: 'Expanded unemployment rate (%)' }) unemployment_expanded!: number;
  @ApiProperty({ description: 'RDP / government housing backlog (units)' }) housing_backlog!: number;
  @ApiProperty({ description: 'People without basic water access' }) without_water!: number;
}

export class ImpactWebResponseDto {
  @ApiProperty({ type: [ImpactWebSectorNodeDto] }) sectors!: ImpactWebSectorNodeDto[];
  @ApiProperty({ type: [ImpactConnectionDto] }) connections!: ImpactConnectionDto[];
  @ApiProperty({
    description: 'Sum of people_affected_estimate across story_impact_sectors (non-null rows).',
  })
  total_people_affected_estimate!: number;
  @ApiProperty({ type: NationalStatsDto })
  national_stats!: NationalStatsDto;
}

export class ImpactStoryExpenditureBriefDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() amount_rands!: string;
  @ApiPropertyOptional({ nullable: true }) what_it_should_have_funded!: string | null;
}

export class ImpactStorySectorImpactDto {
  @ApiProperty() slug!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ nullable: true }) icon!: string | null;
  @ApiProperty({ type: [String] }) impact_chain!: string[];
  @ApiProperty({ enum: ImpactSeverity }) impact_severity!: ImpactSeverity;
  @ApiPropertyOptional({ nullable: true }) amount_diverted_rands!: string | null;
  @ApiPropertyOptional({ nullable: true }) people_affected_estimate!: string | null;
  @ApiPropertyOptional({ nullable: true }) plain_english_impact!: string | null;
}

export class ImpactStorySummaryResponseDto {
  @ApiProperty({ format: 'uuid' }) story_id!: string;
  @ApiProperty({ type: [ImpactStorySectorImpactDto], description: 'Ordered by severity (critical first)' })
  impacts!: ImpactStorySectorImpactDto[];
  @ApiProperty({ type: [ImpactStoryExpenditureBriefDto] })
  expenditures!: ImpactStoryExpenditureBriefDto[];
}

export class MoneyToRealityResponseDto {
  @ApiProperty({ description: 'RDP-equivalent homes at R250k each (floored)' }) rdp_houses!: number;
  @ApiProperty({ description: 'Schools fully repaired at R5m each (floored)' }) school_repairs!: number;
  @ApiProperty({
    description: 'Household water connections at R50k each (floored)',
  })
  water_connections!: number;
  @ApiProperty({
    description: 'Child grant-years at R530 × 12 = R6,360 (floored)',
  })
  child_support_grants!: number;
  @ApiProperty({ description: 'Old-age grant-years at R2,200 × 12 = R26,400 (floored)' })
  old_age_grants!: number;
  @ApiProperty({ description: 'ICU-bed equivalents at R1m each (floored)' }) hospital_beds!: number;
  @ApiProperty({ description: 'Teacher salary-years at R300k average (floored)' })
  teachers_per_year!: number;
}
