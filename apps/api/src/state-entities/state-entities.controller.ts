import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { StateEntityListQueryDto } from './dto/state-entity-query.dto';
import { StateEntitiesService } from './state-entities.service';

@ApiTags('State entities')
@Controller('state-entities')
export class StateEntitiesController {
  constructor(private readonly stateEntities: StateEntitiesService) {}

  @Get('stats')
  @ApiOperation({ summary: 'National SOE scorecard aggregates' })
  @ApiOkResponse({ description: 'Aggregate bailouts, debt, sector breakdown, worst performers' })
  getStats() {
    return this.stateEntities.getStats();
  }

  @Get()
  @ApiOperation({
    summary: 'List state-owned entities',
    description:
      'Paginated list with filters. Sorted by health_score ascending (worst first), nulls last.',
  })
  @ApiOkResponse({ description: 'Paginated StateEntity list items with related story counts' })
  findAll(@Query() query: StateEntityListQueryDto) {
    return this.stateEntities.findAll(query);
  }

  @Get(':slug/timeline')
  @ApiOperation({ summary: 'Timeline events for one SOE' })
  @ApiParam({ name: 'slug', example: 'eskom' })
  @ApiNotFoundResponse({ description: 'Unknown slug' })
  @ApiOkResponse({ description: 'Timeline rows ordered by year ascending' })
  getTimeline(@Param('slug') slug: string) {
    return this.stateEntities.findTimelineBySlug(slug);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'State entity dossier' })
  @ApiParam({ name: 'slug', example: 'eskom' })
  @ApiNotFoundResponse({ description: 'Unknown slug' })
  @ApiOkResponse({ description: 'Full entity with timeline, accountability links, stories, sectors' })
  findOne(@Param('slug') slug: string) {
    return this.stateEntities.findBySlug(slug);
  }
}
