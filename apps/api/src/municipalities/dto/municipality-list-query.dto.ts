import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { AgAuditOutcome, MunicipalityType } from '../../entities/municipality.entity';

export class MunicipalityListQueryDto {
  @ApiPropertyOptional({ description: 'Filter by province slug' })
  @IsOptional()
  @IsString()
  province_slug?: string;

  @ApiPropertyOptional({ enum: MunicipalityType })
  @IsOptional()
  @IsEnum(MunicipalityType)
  municipality_type?: MunicipalityType;

  @ApiPropertyOptional({ enum: AgAuditOutcome })
  @IsOptional()
  @IsEnum(AgAuditOutcome)
  ag_audit_outcome?: AgAuditOutcome;
}
