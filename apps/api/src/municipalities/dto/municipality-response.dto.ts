import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { AgAuditOutcome, MunicipalityType } from '../../entities/municipality.entity';
import { StoryListBriefForProvinceDto } from '../../provinces/dto/province-response.dto';

export class AgAuditHistoryRowDto {
  @ApiPropertyOptional({ nullable: true }) ag_audit_year!: string | null;
  @ApiPropertyOptional({ enum: AgAuditOutcome, nullable: true })
  ag_audit_outcome!: AgAuditOutcome | null;
  @ApiPropertyOptional({ nullable: true }) ag_irregular_expenditure_rands!: string | null;
}

export class MunicipalityListItemDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() short_name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ enum: MunicipalityType }) municipality_type!: MunicipalityType;
  @ApiProperty() province_slug!: string;
  @ApiProperty() province_name!: string;
  @ApiPropertyOptional({ nullable: true }) ag_audit_outcome!: AgAuditOutcome | null;
  @ApiPropertyOptional({ nullable: true }) ag_audit_year!: string | null;
  @ApiPropertyOptional({ nullable: true }) ag_irregular_expenditure_rands!: string | null;
  @ApiProperty() stories_count!: number;
}

export class MunicipalityDetailDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() short_name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ enum: MunicipalityType }) municipality_type!: MunicipalityType;
  @ApiProperty({ format: 'uuid' }) province_id!: string;
  @ApiProperty() province_name!: string;
  @ApiProperty() province_slug!: string;
  @ApiPropertyOptional({ nullable: true }) mayor_name!: string | null;
  @ApiPropertyOptional({ nullable: true }) governing_party!: string | null;
  @ApiPropertyOptional({ nullable: true }) plain_english_audit_outcome!: string | null;
  @ApiPropertyOptional({ nullable: true }) ag_audit_outcome!: AgAuditOutcome | null;
  @ApiPropertyOptional({ nullable: true }) ag_audit_year!: string | null;
  @ApiPropertyOptional({ nullable: true }) ag_irregular_expenditure_rands!: string | null;
  @ApiPropertyOptional({ nullable: true }) annual_budget_rands!: string | null;
  @ApiProperty({ description: 'Sum of expenditure for stories in this municipality' })
  total_money_tracked_rands!: number;
  @ApiProperty({
    type: [AgAuditHistoryRowDto],
    description: 'Latest AG snapshot from municipality row (structured for future multi-year history).',
  })
  ag_audit_history!: AgAuditHistoryRowDto[];
  @ApiProperty({ type: [StoryListBriefForProvinceDto] })
  stories!: StoryListBriefForProvinceDto[];
}
