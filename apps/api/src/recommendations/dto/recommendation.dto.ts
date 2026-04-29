import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  RecommendationCategory,
  RecommendationImplementationStatus,
} from '../../entities/recommendation.entity';

export class RecommendationDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  commission_id!: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  adhoc_committee_id!: string | null;

  @ApiPropertyOptional({ nullable: true }) reference_number!: string | null;
  @ApiProperty() title!: string;
  @ApiPropertyOptional({ nullable: true }) full_text!: string | null;
  @ApiPropertyOptional({ nullable: true }) plain_english!: string | null;
  @ApiPropertyOptional({ nullable: true }) plain_english_child!: string | null;

  @ApiProperty({ enum: RecommendationCategory }) category!: RecommendationCategory;
  @ApiPropertyOptional({ nullable: true }) directed_at!: string | null;
  @ApiPropertyOptional({ type: [String], nullable: true })
  persons_named!: string[] | null;

  @ApiProperty({ enum: RecommendationImplementationStatus })
  implementation_status!: RecommendationImplementationStatus;

  @ApiPropertyOptional({ nullable: true }) implementation_notes!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'date' })
  implementation_date!: string | null;
  @ApiPropertyOptional({ nullable: true }) implementation_source_url!: string | null;
  @ApiPropertyOptional({ nullable: true }) volume_reference!: string | null;
  @ApiProperty() is_verified!: boolean;

  @ApiProperty({ format: 'date-time' }) created_at!: string;
  @ApiProperty({ format: 'date-time' }) updated_at!: string;
}

export class RecommendationStatusCountsDto {
  @ApiProperty() implemented!: number;
  @ApiProperty() partially_implemented!: number;
  @ApiProperty() not_implemented!: number;
  @ApiProperty() in_progress!: number;
  @ApiProperty() rejected!: number;
  @ApiProperty() unknown!: number;
}

export class RecommendationsByCategoryDto {
  @ApiProperty({ type: [RecommendationDto] }) prosecution!: RecommendationDto[];
  @ApiProperty({ type: [RecommendationDto] }) legislation!: RecommendationDto[];
  @ApiProperty({ type: [RecommendationDto] }) policy!: RecommendationDto[];
  @ApiProperty({ type: [RecommendationDto] }) institutional!: RecommendationDto[];
  @ApiProperty({ type: [RecommendationDto] }) disciplinary!: RecommendationDto[];
  @ApiProperty({ type: [RecommendationDto] })
  further_investigation!: RecommendationDto[];

  @ApiProperty({ type: [RecommendationDto] }) compensation!: RecommendationDto[];
  @ApiProperty({ type: [RecommendationDto] }) appointment!: RecommendationDto[];
  @ApiProperty({ type: [RecommendationDto] }) other!: RecommendationDto[];
}

export class CommissionRecommendationBundleDto {
  @ApiProperty({ type: RecommendationsByCategoryDto })
  by_category!: RecommendationsByCategoryDto;

  @ApiProperty({ type: RecommendationStatusCountsDto })
  status_counts!: RecommendationStatusCountsDto;
}

export class CommissionRecommendationsQueryDto {
  @ApiPropertyOptional({ enum: RecommendationCategory })
  @IsOptional()
  @IsEnum(RecommendationCategory)
  category?: RecommendationCategory;

  @ApiPropertyOptional({ enum: RecommendationImplementationStatus })
  @IsOptional()
  @IsEnum(RecommendationImplementationStatus)
  status?: RecommendationImplementationStatus;

  @ApiPropertyOptional({
    description: 'Case-insensitive partial match on `directed_at`.',
    example: 'NPA',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  directed_at?: string;
}

export class CommissionRecommendationsResponseDto {
  @ApiProperty() slug!: string;
  @ApiProperty({ type: [RecommendationDto] })
  recommendations!: RecommendationDto[];

  @ApiProperty({
    type: RecommendationStatusCountsDto,
    description:
      'Counts across **all** recommendations for this commission (ignores list filters).',
  })
  status_counts!: RecommendationStatusCountsDto;
}

export class GlobalRecommendationStatsDto {
  @ApiProperty() total!: number;
  @ApiProperty({ type: RecommendationStatusCountsDto })
  by_status!: RecommendationStatusCountsDto;

  @ApiProperty({
    description: 'Count per category (summed across commissions and committees).',
    example: { prosecution: 2, legislation: 0 },
  })
  by_category!: Record<string, number>;

  @ApiProperty({
    description:
      'Share of recommendations marked implemented (implemented / total × 100), one decimal.',
  })
  implementation_rate!: number;
}
