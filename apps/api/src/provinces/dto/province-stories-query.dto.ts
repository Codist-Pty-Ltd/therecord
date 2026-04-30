import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsPositive, Max, Min } from 'class-validator';

import { ExpenditureSector } from '../../entities/public-expenditure-record.entity';
import { StoryCategory, StoryStatus } from '../../entities/story.entity';

const SORT_FIELDS = ['total_amount_rands', 'updated_at'] as const;
export type ProvinceStorySortField = (typeof SORT_FIELDS)[number];

export class ProvinceStoriesQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({ enum: StoryCategory })
  @IsOptional()
  @IsEnum(StoryCategory)
  story_category?: StoryCategory;

  @ApiPropertyOptional({ enum: StoryStatus })
  @IsOptional()
  @IsEnum(StoryStatus)
  status?: StoryStatus;

  @ApiPropertyOptional({ enum: ExpenditureSector, description: 'Story must have ≥1 expenditure row in this sector' })
  @IsOptional()
  @IsEnum(ExpenditureSector)
  sector?: ExpenditureSector;

  @ApiPropertyOptional({ enum: SORT_FIELDS, description: 'Sort field' })
  @IsOptional()
  @IsIn(SORT_FIELDS)
  sort: ProvinceStorySortField = 'updated_at';

  @ApiPropertyOptional({ enum: ['DESC', 'ASC'], default: 'DESC' })
  @IsOptional()
  @IsIn(['DESC', 'ASC'])
  dir: 'DESC' | 'ASC' = 'DESC';
}
