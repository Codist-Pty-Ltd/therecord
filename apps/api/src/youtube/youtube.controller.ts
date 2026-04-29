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
import { YoutubeVideo } from '../entities/youtube-video.entity';
import {
  YoutubeApproveDto,
  YoutubeRejectDto,
} from './dto/youtube.dto';
import { YoutubeService } from './youtube.service';

function serializeYoutubeVideo(v: YoutubeVideo): Record<string, unknown> {
  return {
    id: v.id,
    youtube_id: v.youtube_id,
    title: v.title,
    channel_name: v.channel_name,
    channel_id: v.channel_id,
    description: v.description,
    published_at: v.published_at?.toISOString() ?? null,
    duration_seconds: v.duration_seconds,
    thumbnail_url: v.thumbnail_url,
    view_count: v.view_count,
    relevance_score: Number(v.relevance_score),
    relevance_reason: v.relevance_reason,
    status: v.status,
    video_type: v.video_type,
    language: v.language,
    commission_id: v.commission_id,
    adhoc_committee_id: v.adhoc_committee_id,
    story_id: v.story_id,
    siu_proclamation_id: v.siu_proclamation_id,
    created_at: v.created_at.toISOString(),
    updated_at: v.updated_at.toISOString(),
  };
}

@ApiTags('youtube')
@Controller('youtube')
export class YoutubeController {
  constructor(private readonly youtube: YoutubeService) {}

  @Post('discover/:entityType/:entityId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(IngestionApiKeyGuard)
  @ApiHeader({
    name: 'x-ingestion-key',
    required: true,
    description: 'Must match INGESTION_API_KEY',
  })
  @ApiOperation({
    summary:
      'Run YouTube discovery for an entity — inserts scored candidates as pending.',
  })
  async discover(
    @Param('entityType') entityType: string,
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Query('maxResults') maxResults?: string,
  ) {
    const n = maxResults ? Number(maxResults) : 10;
    const cap = Number.isFinite(n) ? Math.min(50, Math.max(1, n)) : 10;
    return this.youtube.discoverEntity(
      entityType,
      entityId,
      cap,
    );
  }

  @Get('review-queue')
  @UseGuards(IngestionApiKeyGuard)
  @ApiHeader({
    name: 'x-ingestion-key',
    required: true,
  })
  @ApiOperation({ summary: 'Operator: list pending YouTube review items.' })
  getReviewQueue() {
    return this.youtube.getReviewQueue();
  }

  @Patch(':id/approve')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(IngestionApiKeyGuard)
  @ApiHeader({
    name: 'x-ingestion-key',
    required: true,
  })
  @ApiOperation({ summary: 'Approve a pending video.' })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: YoutubeApproveDto,
  ): Promise<void> {
    await this.youtube.approve(id, body);
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(IngestionApiKeyGuard)
  @ApiHeader({
    name: 'x-ingestion-key',
    required: true,
  })
  @ApiOperation({ summary: 'Reject a pending video.' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: YoutubeRejectDto,
  ): Promise<void> {
    await this.youtube.reject(id, body.reason, body.reviewed_by);
  }

  @Get('stats')
  @UseGuards(IngestionApiKeyGuard)
  @ApiHeader({
    name: 'x-ingestion-key',
    required: true,
  })
  @ApiOperation({ summary: 'Counts by review status.' })
  getStats() {
    return this.youtube.getStats();
  }

  @Get('commission/:commissionId')
  @ApiOperation({ summary: 'Public: approved videos for a commission.' })
  async listCommission(
    @Param('commissionId', ParseUUIDPipe) commissionId: string,
  ) {
    const rows =
      await this.youtube.listApprovedForCommission(commissionId);
    return rows.map((v) => serializeYoutubeVideo(v));
  }

  @Get('adhoc-committee/:committeeId')
  @ApiOperation({ summary: 'Public: approved videos for an ad hoc committee.' })
  async listAdhoc(
    @Param('committeeId', ParseUUIDPipe) committeeId: string,
  ) {
    const rows = await this.youtube.listApprovedForAdhoc(committeeId);
    return rows.map((v) => serializeYoutubeVideo(v));
  }

  @Get('story/:storyId')
  @ApiOperation({ summary: 'Public: approved videos for a story.' })
  async listStory(@Param('storyId', ParseUUIDPipe) storyId: string) {
    const rows = await this.youtube.listApprovedForStory(storyId);
    return rows.map((v) => serializeYoutubeVideo(v));
  }
}
