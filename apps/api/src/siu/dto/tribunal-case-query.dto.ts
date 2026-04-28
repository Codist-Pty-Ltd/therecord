import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TribunalCaseStatus } from '../../entities/special_tribunal_case.entity';

/**
 * Query parameters for `GET /siu/tribunal`.
 *
 * Unpaginated by design: the Special Tribunal docket is bounded (a few
 * hundred matters at peak), so we surface the full list ordered by
 * `value_rands DESC` (biggest civil claims first) — the editorial
 * value is in seeing the largest matters at the top, not in pagination.
 */
export class TribunalCaseQueryDto {
  @ApiPropertyOptional({
    enum: TribunalCaseStatus,
    description: 'Filter by the lifecycle status of the Tribunal case.',
  })
  @IsOptional()
  @IsEnum(TribunalCaseStatus)
  status?: TribunalCaseStatus;
}
