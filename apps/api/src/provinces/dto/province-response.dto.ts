import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { AgAuditOutcome, MunicipalityType } from '../../entities/municipality.entity';
import {
  ExpenditureSector,
  ExpenditureType,
} from '../../entities/public-expenditure-record.entity';
import { StoryCategory, StoryDomain, StoryStatus } from '../../entities/story.entity';
import { PublicExpenditureRecordResponseDto } from '../../expenditure/dto/expenditure-response.dto';

export class ProvinceSummaryDto {
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional({ nullable: true }) abbreviation!: string | null;
  @ApiPropertyOptional({ nullable: true }) capital!: string | null;
}

export class StoryCategoryCountDto {
  @ApiProperty({ enum: StoryCategory }) story_category!: StoryCategory;
  @ApiProperty() count!: number;
}

export class ProvinceListItemDto extends ProvinceSummaryDto {
  @ApiProperty() stories_count!: number;
  @ApiProperty({ description: 'Sum of all expenditure records attributed to this province' })
  total_expenditure_rands!: number;
  @ApiProperty({ type: [StoryCategoryCountDto] })
  story_categories!: StoryCategoryCountDto[];
  @ApiPropertyOptional({ nullable: true, description: 'AG irregular expenditure (province table)' })
  ag_irregular_expenditure_rands!: string | null;
  @ApiPropertyOptional({ nullable: true }) ag_report_year!: string | null;
  @ApiPropertyOptional({ nullable: true, description: 'Corruption Watch % from province row' })
  corruption_watch_complaint_percentage!: string | null;
}

export class MunicipalityBriefDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() short_name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ enum: MunicipalityType }) municipality_type!: MunicipalityType;
  @ApiPropertyOptional({ nullable: true }) mayor_name!: string | null;
  @ApiPropertyOptional({ nullable: true }) ag_audit_outcome!: AgAuditOutcome | null;
  @ApiPropertyOptional({ nullable: true }) ag_audit_year!: string | null;
  @ApiPropertyOptional({ nullable: true }) ag_irregular_expenditure_rands!: string | null;
}

export class StoryListBriefForProvinceDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ enum: StoryDomain }) domain!: StoryDomain;
  @ApiProperty({ enum: StoryStatus }) status!: StoryStatus;
  @ApiPropertyOptional({ enum: StoryCategory, nullable: true }) story_category!: StoryCategory | null;
  @ApiPropertyOptional({ nullable: true }) total_amount_rands!: string | null;
  @ApiProperty({ format: 'date-time' }) updated_at!: string;
}

export class ExpenditureTypeBreakdownDto {
  @ApiProperty({ enum: ExpenditureType }) expenditure_type!: ExpenditureType;
  @ApiProperty() total_rands!: number;
}

export class ExpenditureSectorBreakdownDto {
  @ApiProperty({ enum: ExpenditureSector }) sector!: ExpenditureSector;
  @ApiProperty() total_rands!: number;
}

export class ProvinceDetailDto extends ProvinceListItemDto {
  @ApiProperty({ type: [MunicipalityBriefDto] })
  municipalities!: MunicipalityBriefDto[];
  @ApiProperty({ type: [StoryListBriefForProvinceDto] })
  stories!: StoryListBriefForProvinceDto[];
  @ApiProperty({ type: [ExpenditureTypeBreakdownDto] })
  expenditure_by_type!: ExpenditureTypeBreakdownDto[];
  @ApiProperty({ type: [ExpenditureSectorBreakdownDto] })
  expenditure_by_sector!: ExpenditureSectorBreakdownDto[];
  @ApiProperty({ type: [PublicExpenditureRecordResponseDto] })
  top_expenditure_records!: PublicExpenditureRecordResponseDto[];
}

export class ProvinceStoriesPageDto {
  @ApiProperty({ type: [StoryListBriefForProvinceDto] })
  data!: StoryListBriefForProvinceDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
}

export class ProvinceMoneySummaryDto {
  @ApiProperty() province!: string;
  @ApiProperty() total_under_investigation!: number;
  @ApiProperty() total_allegedly_stolen!: number;
  @ApiProperty() total_confirmed_stolen!: number;
  @ApiProperty() total_recovered!: number;
  @ApiProperty() total_fruitless_wasteful!: number;
  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: { sector: { type: 'string' }, amount: { type: 'number' } },
    },
  })
  by_sector!: { sector: string; amount: number }[];
  @ApiProperty({ type: PublicExpenditureRecordResponseDto })
  largest_single_record!: PublicExpenditureRecordResponseDto | null;
  @ApiProperty() story_count!: number;
}
