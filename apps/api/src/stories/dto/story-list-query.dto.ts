import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
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
}
