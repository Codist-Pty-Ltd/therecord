import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { CommissionPersonRole } from '../../entities/commission_person.entity';
import {
  CommissionDomain,
  CommissionStatus,
} from '../../entities/commission.entity';

export class CommissionCompareQueryDto {
  @ApiProperty({ example: 'zondo-commission' })
  @IsString()
  @MinLength(1)
  left!: string;

  @ApiProperty({ example: 'madlanga-commission' })
  @IsString()
  @MinLength(1)
  right!: string;
}

// -----------------------------------------------------------------------------
// Per-commission summary + diff-style composite response
// -----------------------------------------------------------------------------

export class CommissionCompareSideDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() popular_name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ enum: CommissionDomain }) domain!: CommissionDomain;
  @ApiProperty({ enum: CommissionStatus }) status!: CommissionStatus;
  @ApiProperty() chair_name!: string;
  @ApiPropertyOptional({ nullable: true }) president_who_established!: string | null;

  @ApiPropertyOptional({ nullable: true, format: 'date' })
  announced_date!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'date' })
  hearings_started!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'date' })
  concluded_date!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'date' })
  report_released_date!: string | null;

  /** Days between `hearings_started` and `concluded_date`. Null when unknown. */
  @ApiPropertyOptional({ nullable: true, description: 'Duration in days.' })
  duration_days!: number | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Total cost in ZAR as a whole number.',
  })
  cost_rands!: number | null;

  @ApiPropertyOptional({ nullable: true })
  total_hearing_days!: number | null;

  @ApiPropertyOptional({ nullable: true })
  produced_prosecutions!: boolean | null;

  @ApiProperty({
    type: [String],
    description: "Law sections referenced ('Short Act — Section X').",
  })
  laws_invoked!: string[];

  @ApiProperty({
    type: [String],
    description: 'Full names of people implicated at the commission.',
  })
  people_implicated!: string[];

  @ApiProperty({ description: 'Number of stories linked to this commission.' })
  story_count!: number;
}

export class CommissionCompareDeltaDto {
  @ApiPropertyOptional({
    nullable: true,
    description: 'duration_days(right) - duration_days(left). Null when either is missing.',
  })
  duration_delta_days!: number | null;

  @ApiPropertyOptional({
    nullable: true,
    description:
      'cost_rands(right) - cost_rands(left). Null when either side is missing.',
  })
  cost_delta_rands!: number | null;

  @ApiPropertyOptional({ nullable: true })
  hearing_days_delta!: number | null;

  @ApiProperty({ description: 'Slug of the side that produced prosecutions (or "both"/"neither").' })
  prosecutions_winner!: 'left' | 'right' | 'both' | 'neither' | 'unknown';
}

export class CommissionCompareResponseDto {
  @ApiProperty({ type: CommissionCompareSideDto }) left!: CommissionCompareSideDto;
  @ApiProperty({ type: CommissionCompareSideDto }) right!: CommissionCompareSideDto;
  @ApiProperty({ type: CommissionCompareDeltaDto }) delta!: CommissionCompareDeltaDto;

  /** Role used to decide who counts as "implicated". Exposed so clients can rephrase. */
  @ApiProperty({ enum: CommissionPersonRole, default: CommissionPersonRole.IMPLICATED })
  implicated_role!: CommissionPersonRole;
}
