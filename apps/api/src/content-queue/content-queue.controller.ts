import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { IngestionApiKeyGuard } from '../auth/ingestion-api-key.guard';
import { ContentQueueService } from './content-queue.service';
import { UpdateContentQueueItemDto } from './dto/update-queue-item.dto';

@ApiTags('content-queue')
@Controller('admin/queue')
@UseGuards(IngestionApiKeyGuard)
@ApiHeader({ name: 'x-ingestion-key', required: true })
export class ContentQueueController {
  constructor(private readonly queue: ContentQueueService) {}

  @Get()
  @ApiOperation({ summary: 'List editorial content queue items' })
  list(
    @Query('status') status?: string,
    @Query('source') source?: string,
  ) {
    return this.queue.list({ status, source });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Queue summary counts' })
  stats() {
    return this.queue.getStats();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update queue item status' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateContentQueueItemDto,
  ) {
    return this.queue.update(id, body);
  }

  @Post(':id/ignore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark queue item ignored' })
  ignore(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reviewed_by?: string },
  ) {
    return this.queue.ignore(id, body.reviewed_by);
  }

  @Post(':id/story')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a story draft from a queue item' })
  createStory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reviewed_by?: string },
  ) {
    return this.queue.createStoryFromItem(id, body.reviewed_by);
  }
}
