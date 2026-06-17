import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class IntelligenceAskDto {
  @ApiProperty({
    minLength: 1,
    maxLength: 2000,
    description: 'Natural-language question about The Record corpus.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  query!: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 20, default: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  topK?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  minSimilarity?: number;

  @ApiPropertyOptional({
    description: 'Optional corpus filters: story, commission, person, timeline_event, siu.',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sourceTypes?: string[];
}
