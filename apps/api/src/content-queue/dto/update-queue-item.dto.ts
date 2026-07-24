import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ContentQueueStatus } from '../../entities/content-queue-item.entity';

export class UpdateContentQueueItemDto {
  @ApiPropertyOptional({ enum: ContentQueueStatus })
  @IsOptional()
  @IsIn(['pending', 'reviewed', 'published', 'ignored'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reviewed_by?: string;
}
