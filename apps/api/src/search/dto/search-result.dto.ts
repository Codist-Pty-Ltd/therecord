import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const SEARCH_TYPES = [
  'story',
  'person',
  'commission',
  'committee',
  'siu',
  'law',
  'law_section',
  'province',
  'municipality',
  'accountability_body',
] as const;

export class SearchResultDto {
  @ApiProperty({ enum: SEARCH_TYPES, enumName: 'SearchResultType' })
  type!: (typeof SEARCH_TYPES)[number];

  @ApiProperty()
  id!: string;

  @ApiProperty({ description: 'Primary line for display' })
  name!: string;

  @ApiProperty({ description: 'Secondary line (role, act number, domain, etc.)' })
  subtitle!: string;

  @ApiPropertyOptional()
  slug?: string;

  @ApiPropertyOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Commission / story / SIU taxonomy' })
  domain?: string;

  @ApiProperty({ description: 'In-app path (starts with /)' })
  url!: string;

  @ApiPropertyOptional()
  plain_english?: string;
}

export class SearchResponseDto {
  @ApiProperty()
  query!: string;

  @ApiProperty({ description: 'Number of results before pagination' })
  total!: number;

  @ApiProperty({ type: [SearchResultDto] })
  results!: SearchResultDto[];
}
