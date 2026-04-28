import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CommissionDomain } from '../../entities/commission.entity';
import { ProclamationStatus } from '../../entities/siu_proclamation.entity';

/**
 * Query parameters for `GET /siu/proclamations`.
 *
 * `president_who_signed` is a free-text filter rather than an enum
 * because we can't predict every future president and a typo on a list
 * filter shouldn't 400 the request — the controller falls back to an
 * empty result set if the value matches nobody.
 */
export class SiuProclamationQueryDto {
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
    enum: ProclamationStatus,
    description: 'Lifecycle stage of the SIU investigation.',
  })
  @IsOptional()
  @IsEnum(ProclamationStatus)
  status?: ProclamationStatus;

  @ApiPropertyOptional({
    enum: CommissionDomain,
    description: 'Same 11-value taxonomy used for commissions and committees.',
  })
  @IsOptional()
  @IsEnum(CommissionDomain)
  domain?: CommissionDomain;

  @ApiPropertyOptional({
    description: 'Filter by the president who signed the proclamation.',
    example: 'Cyril Ramaphosa',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  president_who_signed?: string;
}
