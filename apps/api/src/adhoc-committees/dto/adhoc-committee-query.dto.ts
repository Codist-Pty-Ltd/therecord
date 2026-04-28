import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  AdhocCommitteeCategory,
  AdhocCommitteeStatus,
} from '../../entities/adhoc_committee.entity';
import { CommissionDomain } from '../../entities/commission.entity';

/**
 * Query parameters for `GET /adhoc-committees`.
 *
 * Booleans arrive over the wire as the strings `'true'` / `'false'`; the
 * {@link Type}/{@link IsBoolean} pair on {@link is_joint_committee} coerces
 * them to real booleans in the controller. Enum filters silently reject
 * any value not in the enum (class-validator returns 400).
 */
export class AdhocCommitteeQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1, description: 'Page number (1-indexed)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    default: 20,
    description: 'Items per page (max 100)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({
    enum: CommissionDomain,
    description: 'Same 11-value domain taxonomy used for commissions and stories.',
  })
  @IsOptional()
  @IsEnum(CommissionDomain)
  domain?: CommissionDomain;

  @ApiPropertyOptional({ enum: AdhocCommitteeStatus })
  @IsOptional()
  @IsEnum(AdhocCommitteeStatus)
  status?: AdhocCommitteeStatus;

  @ApiPropertyOptional({ enum: AdhocCommitteeCategory })
  @IsOptional()
  @IsEnum(AdhocCommitteeCategory)
  category?: AdhocCommitteeCategory;

  @ApiPropertyOptional({
    description: 'Filter to a specific Parliament term, e.g. "7th Parliament".',
    example: '7th Parliament',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  parliament_term?: string;

  /**
   * `@Type(() => Boolean)` is unsafe for URL-encoded query strings — `'false'`
   * is truthy when passed to `Boolean(...)`. Manual transform instead.
   */
  @ApiPropertyOptional({
    description:
      'If true, only joint NA+NCOP committees. If false, only single-chamber committees.',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return value;
  })
  @IsBoolean()
  is_joint_committee?: boolean;
}
