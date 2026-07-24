import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class SendDigestDto {
  @ApiPropertyOptional({
    description: 'When true, returns preview without sending emails.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;
}
