import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateTimelineEventDto } from './dto/create-timeline-event.dto';
import { TimelineEventResponseDto } from './dto/timeline-event-response.dto';
import { TimelineService } from './timeline.service';

@ApiTags('Timeline')
@Controller('timeline')
export class TimelineController {
  constructor(private readonly timeline: TimelineService) {}

  @Get(':storyId')
  @ApiOperation({
    summary: 'List events for a story',
    description: 'All timeline events for the given story, ordered by event_date ASC.',
  })
  @ApiParam({ name: 'storyId', format: 'uuid' })
  @ApiOkResponse({ type: [TimelineEventResponseDto] })
  async findByStory(
    @Param('storyId', new ParseUUIDPipe({ version: '4' })) storyId: string,
  ): Promise<TimelineEventResponseDto[]> {
    return this.timeline.findByStory(storyId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a timeline event',
    description:
      'Creates a timeline event and, optionally, links it to law sections and/or ' +
      'constitutional sections via event_legal_references. All writes occur in a single transaction.',
  })
  @ApiCreatedResponse({ type: TimelineEventResponseDto })
  async create(@Body() dto: CreateTimelineEventDto): Promise<TimelineEventResponseDto> {
    return this.timeline.create(dto);
  }
}
