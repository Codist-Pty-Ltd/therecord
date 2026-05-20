import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { HistoryService, type HistoricalEraDetailDto } from './history.service';

@ApiTags('History')
@Controller('history')
export class HistoryController {
  constructor(private readonly history: HistoryService) {}

  @Get('eras')
  @ApiOperation({ summary: 'All historical eras with events, laws, statistics' })
  listEras(): Promise<HistoricalEraDetailDto[]> {
    return this.history.listEras();
  }

  @Get('eras/:slug')
  @ApiOperation({ summary: 'Single era by slug' })
  getEra(@Param('slug') slug: string): Promise<HistoricalEraDetailDto> {
    return this.history.getEraBySlug(slug);
  }

  @Get('laws')
  @ApiOperation({ summary: 'Historical (repealed / colonial) laws' })
  listLaws(
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('era_slug') era_slug?: string,
    @Query('is_foundational') is_foundational?: string,
  ) {
    const isF =
      is_foundational === 'true'
        ? true
        : is_foundational === 'false'
          ? false
          : undefined;
    return this.history.listLaws({
      category,
      status,
      era_slug,
      is_foundational: isF,
    });
  }

  @Get('laws/:slug')
  @ApiOperation({ summary: 'Historical law detail with era and optional current-law link' })
  getLaw(@Param('slug') slug: string) {
    return this.history.getLawBySlug(slug);
  }

  @Get('timeline')
  @ApiOperation({ summary: 'All historical events, optional filters' })
  getTimeline(
    @Query('era') era?: string,
    @Query('type') type?: string,
  ) {
    return this.history.getTimeline({ era, type });
  }

  @Get('compare')
  @ApiOperation({ summary: 'Before / during / after headline statistics for UI strip' })
  compare() {
    return this.history.getCompare();
  }
}
