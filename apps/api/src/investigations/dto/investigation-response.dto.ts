import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import {
  InvestigationStatus,
  InvestigationType,
} from '../../entities/investigation.entity';

export class InvestigationQueryDto {
  @ApiPropertyOptional({ enum: InvestigationStatus })
  @IsOptional()
  @IsEnum(InvestigationStatus)
  status?: InvestigationStatus;

  @ApiPropertyOptional({ enum: InvestigationType })
  @IsOptional()
  @IsEnum(InvestigationType)
  investigation_type?: InvestigationType;
}

export class InvestigationResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) story_id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: InvestigationType }) investigation_type!: InvestigationType;
  @ApiProperty() established_by!: string;
  @ApiProperty() legal_basis!: string;
  @ApiPropertyOptional({ nullable: true }) chair_name!: string | null;
  @ApiProperty({ enum: InvestigationStatus }) status!: InvestigationStatus;
  @ApiPropertyOptional({ nullable: true }) official_url!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'date' }) started_at!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'date' }) concluded_at!: string | null;
}
