import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export type YoutubeDiscoverEntityType =
  | 'commission'
  | 'adhoc_committee'
  | 'story'
  | 'siu_proclamation';

export class YoutubeDiscoverIntelligenceDto {
  @ApiProperty({
    enum: ['commission', 'adhoc_committee', 'story', 'siu_proclamation'],
  })
  @IsString()
  entity_type!: YoutubeDiscoverEntityType;

  @ApiProperty()
  @IsUUID()
  entity_id!: string;

  @ApiProperty()
  @IsString()
  entity_name!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  search_queries!: string[];

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  max_results_per_query?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  commission_key?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  chair_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  domain_keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  announced_year?: string;
}

export class YoutubeApproveDto {
  @ApiProperty({
    enum: [
      'news_report',
      'parliamentary',
      'commission_hearing',
      'documentary',
      'analysis',
      'interview',
      'other',
    ],
  })
  @IsString()
  video_type!: string;

  @ApiProperty()
  @IsString()
  reviewed_by!: string;
}

export class YoutubeRejectDto {
  @ApiProperty()
  @IsString()
  reason!: string;

  @ApiProperty()
  @IsString()
  reviewed_by!: string;
}
