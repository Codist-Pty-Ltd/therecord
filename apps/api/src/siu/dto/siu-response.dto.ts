import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import {
  AdhocCommitteeCategory,
  AdhocCommitteeStatus,
} from '../../entities/adhoc_committee.entity';
import {
  CommissionDomain,
  CommissionStatus,
} from '../../entities/commission.entity';
import { PersonStatus } from '../../entities/person.entity';
import { ProclamationStatus } from '../../entities/siu_proclamation.entity';
import { SiuLawSectionUsage } from '../../entities/siu_proclamation_law_section.entity';
import { SiuPersonRole } from '../../entities/siu_proclamation_person.entity';
import { TribunalCaseStatus } from '../../entities/special_tribunal_case.entity';
import {
  ConstitutionSectionResponseDto,
  LawSectionWithLawResponseDto,
} from '../../legal/dto/legal-response.dto';

// -----------------------------------------------------------------------------
// SIU body (singleton)
// -----------------------------------------------------------------------------

export class SiuBodyDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() abbreviation!: string;
  @ApiProperty() enabling_legislation!: string;
  @ApiProperty({ format: 'date' }) established_date!: string;
  @ApiProperty() headquarters!: string;
  @ApiProperty() hotline!: string;
  @ApiPropertyOptional({ nullable: true }) current_head!: string | null;
  @ApiProperty() website_url!: string;
  @ApiProperty() mandate_summary!: string;
  @ApiProperty() plain_english_summary!: string;
  @ApiProperty({ format: 'date-time' }) created_at!: string;
}

// -----------------------------------------------------------------------------
// Aggregate stats — surfaced on /siu and /siu/stats
//
// All Rand values are returned as strings to preserve bigint precision over
// the wire (JSON numbers cannot safely represent values above 2^53). The
// frontend should treat them as numeric strings, not as floats.
// -----------------------------------------------------------------------------

export class SiuStatsDto {
  @ApiProperty({ example: 87 }) total_proclamations!: number;
  @ApiProperty({ example: 23 }) active_proclamations_count!: number;
  @ApiProperty({ example: 64 }) concluded_proclamations_count!: number;

  @ApiProperty({
    example: '64800000000',
    description: 'Sum of total_value_investigated across all outcomes (string-encoded bigint).',
  })
  total_investigated_rands!: string;

  @ApiProperty({
    example: '389000000',
    description: 'Sum of actual_recovered_rands across all outcomes (string-encoded bigint).',
  })
  total_recovered_rands!: string;

  @ApiProperty({
    example: '2100000000',
    description: 'Sum of losses_prevented_rands across all outcomes (string-encoded bigint).',
  })
  total_prevented_rands!: string;

  @ApiProperty({
    example: '47200000000',
    description: 'Sum of civil_litigation_value_rands across all outcomes (string-encoded bigint).',
  })
  total_civil_litigation_rands!: string;

  @ApiProperty({ example: 412 }) total_npa_referrals!: number;
  @ApiProperty({ example: 198 }) total_hawks_referrals!: number;
  @ApiProperty({ example: 521 }) total_department_referrals!: number;
  @ApiProperty({ example: 73 }) total_employees_dismissed!: number;
  @ApiProperty({ example: 142 }) total_tribunal_cases!: number;
}

// -----------------------------------------------------------------------------
// Proclamation summary (list endpoint + base for detail)
// -----------------------------------------------------------------------------

export class SiuProclamationSummaryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'R23 of 2020' }) proclamation_number!: string;
  @ApiProperty({ example: 'proclamation-r23-2020-ppe' }) slug!: string;
  @ApiProperty() title!: string;
  @ApiPropertyOptional({ nullable: true }) full_title!: string | null;
  @ApiPropertyOptional({ nullable: true }) gazette_number!: string | null;

  @ApiPropertyOptional({ nullable: true, format: 'date' })
  signed_date!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'date' })
  published_date!: string | null;

  @ApiProperty({ enum: CommissionDomain }) domain!: CommissionDomain;
  @ApiProperty() investigation_scope!: string;
  @ApiProperty() plain_english_summary!: string;
  @ApiProperty() president_who_signed!: string;

  @ApiPropertyOptional({ nullable: true, format: 'date' })
  period_covered_start!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'date' })
  period_covered_end!: string | null;

  @ApiProperty({ enum: ProclamationStatus }) status!: ProclamationStatus;

  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  related_commission_id!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  related_adhoc_committee_id!: string | null;

  @ApiPropertyOptional({ nullable: true }) official_url!: string | null;

  @ApiProperty({ format: 'date-time' }) created_at!: string;
  @ApiProperty({ format: 'date-time' }) updated_at!: string;

  /** Story-count rolled up at read-time so list views can show the chip. */
  @ApiPropertyOptional({ nullable: true, example: 4 })
  story_count?: number;

  /**
   * Headline financial figure — `actual_recovered_rands` from the linked
   * outcome, surfaced here so the list view doesn't have to hit the
   * detail endpoint to render the "R X recovered" chip. String-encoded
   * bigint, null if no outcome row exists yet.
   */
  @ApiPropertyOptional({ nullable: true, example: '389000000' })
  recovered_rands?: string | null;

  /**
   * Outcome aggregates folded onto the summary so the editorial list view
   * can render the full "investigated · recovered · referrals · tribunal
   * cases" row without an N+1 fan-out to the detail endpoint. All four
   * fields are null when the proclamation has no outcome row yet (i.e.
   * the investigation hasn't reported); referral / case counts default to
   * 0 in that case so the UI can render neutral chips. Bigint Rand values
   * stay string-encoded — same precision contract as `recovered_rands`.
   */
  @ApiPropertyOptional({ nullable: true, example: '23000000000' })
  investigated_rands?: string | null;

  @ApiPropertyOptional({ example: 87 })
  npa_referrals?: number;

  @ApiPropertyOptional({ example: 156 })
  department_referrals?: number;

  @ApiPropertyOptional({ example: 35 })
  tribunal_cases_filed?: number;
}

// -----------------------------------------------------------------------------
// Nested DTOs for the detail view
// -----------------------------------------------------------------------------

export class SiuInvestigationOutcomeDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) proclamation_id!: string;

  @ApiPropertyOptional({ nullable: true }) total_value_investigated!: string | null;
  @ApiPropertyOptional({ nullable: true }) financial_losses_identified!: string | null;
  @ApiPropertyOptional({ nullable: true }) actual_recovered_rands!: string | null;
  @ApiPropertyOptional({ nullable: true }) losses_prevented_rands!: string | null;
  @ApiPropertyOptional({ nullable: true }) civil_litigation_value_rands!: string | null;
  @ApiPropertyOptional({ nullable: true }) contracts_set_aside_value!: string | null;

  @ApiProperty({ example: 0 }) referrals_to_npa!: number;
  @ApiProperty({ example: 0 }) referrals_to_hawks!: number;
  @ApiProperty({ example: 0 }) referrals_to_departments!: number;
  @ApiProperty({ example: 0 }) employees_referred_disciplinary!: number;
  @ApiProperty({ example: 0 }) employees_dismissed!: number;
  @ApiProperty({ example: 0 }) special_tribunal_cases_filed!: number;

  @ApiPropertyOptional({ nullable: true }) outcome_summary!: string | null;
  @ApiPropertyOptional({ nullable: true }) plain_english_outcome!: string | null;

  @ApiPropertyOptional({ nullable: true, format: 'date' })
  report_submitted_date!: string | null;
  @ApiPropertyOptional({ nullable: true }) report_url!: string | null;

  @ApiProperty({ format: 'date-time' }) created_at!: string;
  @ApiProperty({ format: 'date-time' }) updated_at!: string;
}

export class SpecialTribunalCaseBriefDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) proclamation_id!: string;
  @ApiProperty({ example: 'GP01/2021' }) case_number!: string;
  @ApiProperty() case_title!: string;
  @ApiPropertyOptional({ nullable: true }) value_rands!: string | null;
  @ApiProperty({ type: [String] }) respondents!: string[];
  @ApiProperty() nature_of_claim!: string;
  @ApiPropertyOptional({ nullable: true, format: 'date' })
  filed_date!: string | null;
  @ApiProperty({ enum: TribunalCaseStatus }) status!: TribunalCaseStatus;
  @ApiPropertyOptional({ nullable: true }) outcome_summary!: string | null;
  @ApiPropertyOptional({ nullable: true }) amount_recovered_rands!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'date' })
  judgment_date!: string | null;
  @ApiPropertyOptional({ nullable: true }) judgment_url!: string | null;
  @ApiPropertyOptional({ nullable: true }) plain_english_outcome!: string | null;
}

export class SiuProclamationStoryBriefDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() domain!: string;
  @ApiProperty() status!: string;
  @ApiPropertyOptional({ nullable: true }) summary!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'date' })
  latest_event_date!: string | null;
}

export class SiuProclamationPersonBriefDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) proclamation_id!: string;
  @ApiProperty({ format: 'uuid' }) person_id!: string;
  @ApiProperty() full_name!: string;
  @ApiPropertyOptional({ nullable: true }) current_role!: string | null;
  @ApiPropertyOptional({ nullable: true }) organisation!: string | null;
  @ApiProperty({ enum: PersonStatus }) person_status!: PersonStatus;
  @ApiProperty({ enum: SiuPersonRole }) role!: SiuPersonRole;
  @ApiPropertyOptional({ nullable: true }) summary!: string | null;
}

/** Compact representation of a paired commission. */
export class SiuRelatedCommissionDto {
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

/** Compact representation of a paired ad hoc committee. */
export class SiuRelatedAdhocCommitteeDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() popular_name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ enum: CommissionDomain }) domain!: CommissionDomain;
  @ApiProperty({ enum: AdhocCommitteeStatus }) status!: AdhocCommitteeStatus;
  @ApiProperty({ enum: AdhocCommitteeCategory }) category!: AdhocCommitteeCategory;
  @ApiPropertyOptional({ nullable: true }) chair_name!: string | null;
  @ApiPropertyOptional({ nullable: true }) parliament_term!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'date' })
  announced_date!: string | null;
}

// -----------------------------------------------------------------------------
// Detail + list wrappers
//
// Defined AFTER the nested DTOs above on purpose — TypeORM's
// emitDecoratorMetadata emits runtime references for every decorated
// property, and the referenced classes must be initialised before any
// wrapper that references them is read.
// -----------------------------------------------------------------------------

/** One row in the proclamation → law/constitution join, for detail grouping. */
export class SiuProclamationLawSectionItemDto {
  @ApiProperty({ format: 'uuid' }) id!: string;

  @ApiProperty({ enum: SiuLawSectionUsage })
  usage_type!: SiuLawSectionUsage;

  @ApiPropertyOptional({ nullable: true })
  relevance!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: () => LawSectionWithLawResponseDto,
    description: 'Set when the link targets a statute section.',
  })
  law_section!: LawSectionWithLawResponseDto | null;

  @ApiPropertyOptional({
    nullable: true,
    type: () => ConstitutionSectionResponseDto,
    description: 'Set when the link targets a row in `constitution_sections`.',
  })
  constitution_section!: ConstitutionSectionResponseDto | null;
}

export class SiuProclamationLawSectionsByUsageDto {
  @ApiProperty({ type: [SiuProclamationLawSectionItemDto] })
  enabling!: SiuProclamationLawSectionItemDto[];

  @ApiProperty({ type: [SiuProclamationLawSectionItemDto] })
  investigated!: SiuProclamationLawSectionItemDto[];

  @ApiProperty({ type: [SiuProclamationLawSectionItemDto] })
  violated!: SiuProclamationLawSectionItemDto[];

  @ApiProperty({ type: [SiuProclamationLawSectionItemDto] })
  recovered_under!: SiuProclamationLawSectionItemDto[];
}

export class SiuProclamationDetailResponseDto extends SiuProclamationSummaryDto {
  @ApiPropertyOptional({
    nullable: true,
    type: SiuInvestigationOutcomeDto,
    description: 'Financial + referral outcome. Null if not yet recorded.',
  })
  outcome!: SiuInvestigationOutcomeDto | null;

  @ApiProperty({
    type: [SpecialTribunalCaseBriefDto],
    description: 'Civil cases brought in the Special Tribunal under this proclamation.',
  })
  tribunal_cases!: SpecialTribunalCaseBriefDto[];

  @ApiProperty({ type: [SiuProclamationStoryBriefDto] })
  stories!: SiuProclamationStoryBriefDto[];

  @ApiProperty({ type: [SiuProclamationPersonBriefDto] })
  people!: SiuProclamationPersonBriefDto[];

  @ApiPropertyOptional({
    nullable: true,
    type: SiuRelatedCommissionDto,
    description: 'Populated when this proclamation followed from a commission of inquiry.',
  })
  related_commission!: SiuRelatedCommissionDto | null;

  @ApiPropertyOptional({
    nullable: true,
    type: SiuRelatedAdhocCommitteeDto,
    description: 'Populated when an ad hoc committee ran in parallel on the same matter.',
  })
  related_adhoc_committee!: SiuRelatedAdhocCommitteeDto | null;

  @ApiProperty({
    type: () => SiuProclamationLawSectionsByUsageDto,
    description:
      'Statute and constitutional sections linked to this proclamation, grouped by SIU usage.',
  })
  law_sections_by_usage!: SiuProclamationLawSectionsByUsageDto;
}

export class SiuProclamationListResponseDto {
  @ApiProperty({ type: [SiuProclamationSummaryDto] })
  data!: SiuProclamationSummaryDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

/** Combined response for `GET /siu` — body metadata + headline stats. */
export class SiuOverviewResponseDto {
  @ApiProperty({ type: SiuBodyDto })
  body!: SiuBodyDto;

  @ApiProperty({ type: SiuStatsDto })
  stats!: SiuStatsDto;
}

/** Special Tribunal info + its full caseload. */
export class SpecialTribunalDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ format: 'date' }) established_date!: string;
  @ApiProperty() enabling_legislation!: string;
  @ApiProperty() plain_english_summary!: string;
  @ApiPropertyOptional({ nullable: true }) address!: string | null;
  @ApiPropertyOptional({ nullable: true }) website_url!: string | null;
  @ApiProperty({ format: 'date-time' }) created_at!: string;
}

export class SpecialTribunalOverviewResponseDto {
  @ApiProperty({ type: SpecialTribunalDto })
  tribunal!: SpecialTribunalDto;

  @ApiProperty({ type: [SpecialTribunalCaseBriefDto] })
  cases!: SpecialTribunalCaseBriefDto[];

  @ApiProperty({ example: 142 })
  total!: number;
}

/**
 * Single tribunal case detail — extends the brief with the parent
 * proclamation summary so the frontend has navigation context.
 */
export class SpecialTribunalCaseDetailResponseDto extends SpecialTribunalCaseBriefDto {
  @ApiProperty({ type: SiuProclamationSummaryDto })
  proclamation!: SiuProclamationSummaryDto;
}
