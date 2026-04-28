import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import {
  CommissionDomain,
  CommissionStatus,
} from '../../entities/commission.entity';
import { CommissionPersonRole } from '../../entities/commission_person.entity';
import { PersonStatus } from '../../entities/person.entity';
import { StoryDomain, StoryStatus } from '../../entities/story.entity';
import {
  EventSignificance,
  EventType,
} from '../../entities/timeline_event.entity';

export class PersonListItemDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() full_name!: string;
  @ApiProperty({ type: [String] }) aliases!: string[];
  @ApiPropertyOptional({ nullable: true }) current_role!: string | null;
  @ApiPropertyOptional({ nullable: true }) organisation!: string | null;
  @ApiProperty({ enum: PersonStatus }) status!: PersonStatus;
  @ApiPropertyOptional({ nullable: true }) profile_summary!: string | null;
  @ApiProperty({ format: 'date-time' }) created_at!: string;
  @ApiProperty({ format: 'date-time' }) updated_at!: string;

  @ApiProperty({
    description:
      'Distinct commissions of inquiry this person appears on (from commission_person).',
    example: 2,
  })
  commission_count!: number;
}

export class PersonListResponseDto {
  @ApiProperty({ type: [PersonListItemDto] }) data!: PersonListItemDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}

export class PersonStoryAppearanceDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ enum: StoryDomain }) domain!: StoryDomain;
  @ApiProperty({ enum: StoryStatus }) status!: StoryStatus;
  @ApiProperty() role_in_story!: string;
  @ApiProperty() is_key_figure!: boolean;
}

export class PersonEventAppearanceDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) story_id!: string;
  @ApiProperty({ format: 'date' }) event_date!: string;
  @ApiProperty({ enum: EventType }) event_type!: EventType;
  @ApiProperty() title!: string;
  @ApiProperty({ enum: EventSignificance }) significance!: EventSignificance;
}

/**
 * A single commission appearance. The same person can appear on one commission
 * under multiple roles (witness who was later implicated, etc.) so this row is
 * ONE (commission × role) combination rather than a deduplicated commission.
 */
export class PersonCommissionAppearanceDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) commission_id!: string;
  @ApiProperty() popular_name!: string;
  @ApiProperty() full_name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ enum: CommissionDomain }) domain!: CommissionDomain;
  @ApiProperty({ enum: CommissionStatus }) status!: CommissionStatus;
  @ApiProperty({ enum: CommissionPersonRole }) role!: CommissionPersonRole;
  @ApiPropertyOptional({ nullable: true }) summary!: string | null;

  /** Chair of the commission — useful context for the `/person/[id]` page. */
  @ApiProperty() chair_name!: string;

  @ApiPropertyOptional({ nullable: true, format: 'date' })
  announced_date!: string | null;

  @ApiPropertyOptional({ nullable: true, format: 'date' })
  concluded_date!: string | null;

  @ApiPropertyOptional({ nullable: true, format: 'date' })
  report_released_date!: string | null;

  @ApiPropertyOptional({ nullable: true })
  produced_prosecutions!: boolean | null;
}

export class PersonDetailResponseDto extends PersonListItemDto {
  @ApiProperty({ type: [PersonStoryAppearanceDto] })
  stories!: PersonStoryAppearanceDto[];

  @ApiProperty({
    type: [PersonCommissionAppearanceDto],
    description:
      'Every commission of inquiry this person has appeared in, with their role at each commission.',
  })
  commissions!: PersonCommissionAppearanceDto[];

  @ApiProperty({
    type: [PersonEventAppearanceDto],
    description: 'All timeline events from all stories this person appears in.',
  })
  events!: PersonEventAppearanceDto[];
}
