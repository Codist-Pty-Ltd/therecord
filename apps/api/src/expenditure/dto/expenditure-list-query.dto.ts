import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

import {
  ExpenditureSector,
  ExpenditureType,
} from '../../entities/public-expenditure-record.entity';

export class ExpenditureListQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({ description: 'Filter by province PK' })
  @IsOptional()
  @IsUUID()
  province_id?: string;

  @ApiPropertyOptional({ description: 'Filter by municipality PK' })
  @IsOptional()
  @IsUUID()
  municipality_id?: string;

  @ApiPropertyOptional({ enum: ExpenditureSector })
  @IsOptional()
  @IsEnum(ExpenditureSector)
  sector?: ExpenditureSector;

  @ApiPropertyOptional({ enum: ExpenditureType })
  @IsOptional()
  @IsEnum(ExpenditureType)
  expenditure_type?: ExpenditureType;
}
