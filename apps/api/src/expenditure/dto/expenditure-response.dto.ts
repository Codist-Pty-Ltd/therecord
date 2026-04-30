import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  AmountQualifier,
  ExpenditureSector,
  ExpenditureType,
} from '../../entities/public-expenditure-record.entity';

export class PublicExpenditureRecordResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) story_id!: string;
  @ApiPropertyOptional({ nullable: true, format: 'uuid' }) province_id!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'uuid' }) municipality_id!: string | null;
  @ApiProperty({ description: 'Whole rands (bigint as string in JSON)' })
  amount_rands!: string;
  @ApiProperty({ enum: AmountQualifier }) amount_qualifier!: AmountQualifier;
  @ApiProperty({ enum: ExpenditureType }) expenditure_type!: ExpenditureType;
  @ApiProperty({ enum: ExpenditureSector }) sector!: ExpenditureSector;
  @ApiProperty() description!: string;
  @ApiPropertyOptional({
    nullable: true,
    description: 'Human-impact line: what this money could have funded instead.',
  })
  what_it_should_have_funded!: string | null;
  @ApiPropertyOptional({ nullable: true }) plain_english!: string | null;
  @ApiPropertyOptional({ nullable: true }) source_document!: string | null;
  @ApiPropertyOptional({ nullable: true }) source_url!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'date' }) reference_date!: string | null;
  @ApiProperty() is_verified!: boolean;
  @ApiProperty({
    description:
      'When false, excluded from the national money counter sum (story still shows the row).',
    default: true,
  })
  is_primary_record!: boolean;
  @ApiProperty({ format: 'date-time' }) created_at!: string;
  @ApiProperty({ format: 'date-time' }) updated_at!: string;
}

export class ExpenditureCounterProvinceRowDto {
  @ApiProperty() province_name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ description: 'Sum of amount_rands in this province bucket' })
  total_rands!: number;
  @ApiProperty({ description: 'Distinct stories with expenditure in this province' })
  story_count!: number;
}

export class ExpenditureCounterSectorRowDto {
  @ApiProperty({ enum: ExpenditureSector }) sector!: ExpenditureSector;
  @ApiProperty() total_rands!: number;
  @ApiProperty() story_count!: number;
}

export class ExpenditureCounterResponseDto {
  @ApiProperty() total_tracked_rands!: number;
  @ApiProperty() total_under_investigation_rands!: number;
  @ApiProperty() total_allegedly_stolen_rands!: number;
  @ApiProperty() total_confirmed_stolen_rands!: number;
  @ApiProperty() total_recovered_rands!: number;
  @ApiProperty() total_prevented_rands!: number;
  @ApiProperty() total_fruitless_wasteful_rands!: number;
  @ApiProperty({
    description:
      'Sum of amount_rands for counter-eligible rows that also have a non‑empty what_it_should_have_funded narrative.',
  })
  total_tracked_rands_with_what_it_should_have_funded!: number;
  @ApiProperty() story_count!: number;
  @ApiProperty({
    description:
      'Distinct provinces (from expenditure.province_id or fallback story.province_id)',
  })
  province_count!: number;
  @ApiProperty({ type: [ExpenditureCounterProvinceRowDto] })
  by_province!: ExpenditureCounterProvinceRowDto[];
  @ApiProperty({ type: [ExpenditureCounterSectorRowDto] })
  by_sector!: ExpenditureCounterSectorRowDto[];
  @ApiProperty({
    format: 'date-time',
    description: 'Latest expenditure record update timestamp',
  })
  updated_at!: string;

  @ApiProperty({
    description:
      'Required legal framing for the homepage counter — always returned verbatim from the API.',
  })
  disclaimer!: string;

  @ApiProperty({
    description: 'In-app path to the methodology explainer (Money tracking).',
    example: '/about#money-tracking',
  })
  methodology_url!: string;
}

export class ExpenditureByStoryResponseDto {
  @ApiProperty({ format: 'uuid' }) story_id!: string;
  @ApiProperty({ description: 'Sum of all amounts for this story' })
  total_rands!: number;
  @ApiProperty({ type: [PublicExpenditureRecordResponseDto] })
  records!: PublicExpenditureRecordResponseDto[];
}

export class ExpenditureListResponseDto {
  @ApiProperty({ type: [PublicExpenditureRecordResponseDto] })
  data!: PublicExpenditureRecordResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
}
