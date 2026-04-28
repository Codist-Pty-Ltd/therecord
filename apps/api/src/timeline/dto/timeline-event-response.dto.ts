import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EventSignificance,
  EventType,
} from '../../entities/timeline_event.entity';

export class TimelineLegalReferenceDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) law_section_id!: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) constitution_section_id!: string | null;
  @ApiProperty() relevance!: string;
  @ApiProperty() alleged_violation!: boolean;
}

export class TimelineEventResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) story_id!: string;
  @ApiProperty({ format: 'date' }) event_date!: string;
  @ApiProperty({ enum: EventType }) event_type!: EventType;
  @ApiProperty() title!: string;
  @ApiProperty() description!: string;
  @ApiProperty() plain_english!: string;
  @ApiProperty({ enum: EventSignificance }) significance!: EventSignificance;
  @ApiProperty({ type: [String] }) source_urls!: string[];
  @ApiProperty({ type: [TimelineLegalReferenceDto] })
  legal_references!: TimelineLegalReferenceDto[];
  @ApiProperty({ format: 'date-time' }) created_at!: string;
}
