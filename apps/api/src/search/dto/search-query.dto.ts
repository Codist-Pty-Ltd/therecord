import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

/**
 * Query string for `GET /api/search`.
 */
export class SearchQueryDto {
  @ApiProperty({
    minLength: 2,
    maxLength: 200,
    description: 'Search text (at least 2 non-whitespace characters).',
  })
  @Transform(({ value }) => {
    const v = Array.isArray(value) ? value[0] : value;
    return typeof v === 'string' ? v.trim() : '';
  })
  @IsString()
  @MaxLength(200)
  @MinLength(2, { message: 'Search query must be at least 2 characters' })
  q!: string;

  @ApiPropertyOptional({
    description:
      'Comma-separated: stories, people, commissions, committees, siu, laws, law_sections. ' +
      'Omit to search all types.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  types?: string;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  limit?: number;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
}
