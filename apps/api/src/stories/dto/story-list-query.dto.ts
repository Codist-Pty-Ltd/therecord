import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { StoryDomain } from '../../entities/story.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/**
 * `GET /api/stories` — optional {@link StoryDomain} filter (same 5 values as
 * the `stories` table / {@link StoryDomain} enum in shared-types).
 */
export class StoryListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: StoryDomain })
  @IsOptional()
  @IsEnum(StoryDomain)
  domain?: StoryDomain;

  @ApiPropertyOptional({
    description:
      '`latest_event` (default): order by newest timeline event per story, then created_at. ' +
      '`updated_at`: order by story row updated_at (newest editorial changes first).',
    enum: ['latest_event', 'updated_at'],
  })
  @IsOptional()
  @IsIn(['latest_event', 'updated_at'])
  sort?: 'latest_event' | 'updated_at';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC';
}
