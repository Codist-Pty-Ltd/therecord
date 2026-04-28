import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import {
  EventSignificance,
  EventType,
} from '../../entities/timeline_event.entity';

export class CreateTimelineEventDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  story_id!: string;

  @ApiProperty({
    format: 'date',
    description: 'ISO date (YYYY-MM-DD). No time component.',
    example: '2025-09-10',
  })
  @IsDateString({ strict: true })
  event_date!: string;

  @ApiProperty({ enum: EventType })
  @IsEnum(EventType)
  event_type!: EventType;

  @ApiProperty({ maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ description: 'Plain-English explanation readable by a child.' })
  @IsString()
  @IsNotEmpty()
  plain_english!: string;

  @ApiPropertyOptional({ enum: EventSignificance, default: EventSignificance.MEDIUM })
  @IsOptional()
  @IsEnum(EventSignificance)
  significance?: EventSignificance;

  @ApiPropertyOptional({ type: [String], description: 'Source URLs backing the event.' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  source_urls?: string[];

  /* ------------------------------------------------------- legal refs */

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'Law section IDs to link to this event via event_legal_references.',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  law_section_ids?: string[];

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'Constitution section IDs to link to this event via event_legal_references.',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  constitution_section_ids?: string[];

  /**
   * Required whenever `law_section_ids` or `constitution_section_ids` is non-empty,
   * because `event_legal_references.relevance` is a NOT NULL column.
   */
  @ApiPropertyOptional({
    description:
      'Why these law/constitution references apply to this event. ' +
      'Required when law_section_ids or constitution_section_ids is provided.',
  })
  @ValidateIf(
    (o: CreateTimelineEventDto) =>
      (o.law_section_ids?.length ?? 0) > 0 ||
      (o.constitution_section_ids?.length ?? 0) > 0,
  )
  @IsString()
  @IsNotEmpty()
  legal_relevance?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  alleged_violation?: boolean;
}
