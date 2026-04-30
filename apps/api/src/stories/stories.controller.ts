import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { StoryListQueryDto } from './dto/story-list-query.dto';
import { CreateStoryDto } from './dto/create-story.dto';
import {
  StoryDetailResponseDto,
  StoryListItemDto,
  StoryListResponseDto,
} from './dto/story-response.dto';
import { StoriesService } from './stories.service';
import { SimilarStoryBriefDto } from './dto/story-response.dto';

@ApiTags('Stories')
@Controller('stories')
export class StoriesController {
  constructor(private readonly stories: StoriesService) {}

  @Get()
  @ApiOperation({
    summary: 'List active stories',
    description:
      'Paginated list of active stories, ordered by most recent timeline event (then by creation date). ' +
      'Optionally filter by `domain` (story_domain enum).',
  })
  @ApiOkResponse({ type: StoryListResponseDto })
  async findAll(@Query() query: StoryListQueryDto): Promise<StoryListResponseDto> {
    return this.stories.findAll(query.page, query.limit, query.domain);
  }

  @Get(':slug/similar')
  @ApiOperation({
    summary: 'Similar stories',
    description:
      'Uses `similar_stories` rows first; fills up to 5 with same province or same story_category.',
  })
  @ApiOkResponse({ type: [SimilarStoryBriefDto] })
  async findSimilar(@Param('slug') slug: string): Promise<SimilarStoryBriefDto[]> {
    return this.stories.findSimilarBySlug(slug);
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Get full story by slug',
    description:
      'Returns a story with its full timeline, people, investigations, articles (latest 50), and referenced law sections.',
  })
  @ApiOkResponse({ type: StoryDetailResponseDto })
  async findBySlug(@Param('slug') slug: string): Promise<StoryDetailResponseDto> {
    return this.stories.findBySlug(slug);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a story (admin)',
    description:
      'Creates a new story thread. Slug is auto-generated from the title unless an explicit slug is provided. ' +
      'No auth yet — do not expose publicly.',
  })
  @ApiBody({ type: CreateStoryDto })
  @ApiCreatedResponse({ type: StoryListItemDto })
  async create(@Body() dto: CreateStoryDto): Promise<StoryListItemDto> {
    return this.stories.create(dto);
  }
}
