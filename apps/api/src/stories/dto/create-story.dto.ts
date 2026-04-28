import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { StoryDomain, StoryStatus } from '../../entities/story.entity';

export class CreateStoryDto {
  @ApiProperty({ maxLength: 500, example: 'The Madlanga Commission and the SAPS Crisis' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title!: string;

  @ApiProperty({ enum: StoryDomain, example: StoryDomain.CRIMINAL_JUSTICE })
  @IsEnum(StoryDomain)
  domain!: StoryDomain;

  @ApiPropertyOptional({
    enum: StoryStatus,
    default: StoryStatus.ACTIVE,
    description: 'Defaults to ACTIVE when omitted.',
  })
  @IsOptional()
  @IsEnum(StoryStatus)
  status?: StoryStatus;

  @ApiPropertyOptional({
    description:
      'Editorial-length summary for analysts / readers familiar with the domain.',
  })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({
    description: 'Plain-English summary readable by a child.',
  })
  @IsOptional()
  @IsString()
  plain_english_summary?: string;

  @ApiPropertyOptional({
    maxLength: 500,
    description:
      'Optional custom slug. Omit to auto-generate from title. ' +
      'Must be lowercase alphanumeric + hyphens only.',
    example: 'madlanga-commission-saps-crisis',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase alphanumeric segments separated by single hyphens',
  })
  slug?: string;
}
