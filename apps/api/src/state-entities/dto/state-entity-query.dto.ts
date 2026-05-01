import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  StateEntityFinancialHealth,
  StateEntitySector,
  StateEntityStatus,
} from '../../entities/state-entity.entity';

export class StateEntityListQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({ enum: StateEntitySector })
  @IsOptional()
  @IsEnum(StateEntitySector)
  sector?: StateEntitySector;

  @ApiPropertyOptional({ enum: StateEntityStatus })
  @IsOptional()
  @IsEnum(StateEntityStatus)
  status?: StateEntityStatus;

  @ApiPropertyOptional({ enum: StateEntityFinancialHealth })
  @IsOptional()
  @IsEnum(StateEntityFinancialHealth)
  financial_health?: StateEntityFinancialHealth;

  @ApiPropertyOptional({
    description: 'If true, only entities flagged `is_in_crisis`. If false, only those not in crisis.',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return value;
  })
  @IsBoolean()
  is_in_crisis?: boolean;
}
