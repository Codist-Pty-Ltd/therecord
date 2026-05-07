import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransformationPolicyStatus } from '../../entities/transformation-policy.entity';

/** Public JSON for `GET /api/transformation-policies/:slug`. */
export class TransformationPolicyDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ nullable: true }) abbreviation!: string | null;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional({ nullable: true }) enabling_act!: string | null;
  @ApiProperty({ enum: TransformationPolicyStatus }) status!: TransformationPolicyStatus;
  @ApiProperty() purpose_summary!: string;
  @ApiProperty() plain_english_child!: string;
  @ApiProperty() plain_english_layperson!: string;
  @ApiProperty() plain_english_legal!: string;
  @ApiProperty() historical_context!: string;
  @ApiProperty() arguments_for!: string;
  @ApiProperty() arguments_against!: string;
  @ApiPropertyOptional({ nullable: true }) current_legal_challenges!: string | null;
  @ApiProperty() impact_on_ordinary_people!: string;
  @ApiProperty({ format: 'date-time' }) created_at!: string;
  @ApiProperty({ format: 'date-time' }) updated_at!: string;
}
