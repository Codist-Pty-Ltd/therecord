import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ProvinceStoriesQueryDto } from './dto/province-stories-query.dto';
import {
  ProvinceDetailDto,
  ProvinceListItemDto,
  ProvinceMoneySummaryDto,
  ProvinceStoriesPageDto,
} from './dto/province-response.dto';
import { ProvincesService } from './provinces.service';

@ApiTags('Provinces')
@Controller('provinces')
export class ProvincesController {
  constructor(private readonly provinces: ProvincesService) {}

  @Get()
  @ApiOperation({ summary: 'List all provinces with accountability roll-ups' })
  @ApiOkResponse({ type: [ProvinceListItemDto] })
  findAll(): Promise<ProvinceListItemDto[]> {
    return this.provinces.findAll();
  }

  @Get(':slug/money')
  @ApiOperation({ summary: 'Provincial financial summary (money counter slice)' })
  @ApiOkResponse({ type: ProvinceMoneySummaryDto })
  getMoney(@Param('slug') slug: string): Promise<ProvinceMoneySummaryDto> {
    return this.provinces.getMoneySummary(slug);
  }

  @Get(':slug/stories')
  @ApiOperation({ summary: 'Paginated stories for a province' })
  @ApiOkResponse({ type: ProvinceStoriesPageDto })
  getStories(
    @Param('slug') slug: string,
    @Query() query: ProvinceStoriesQueryDto,
  ): Promise<ProvinceStoriesPageDto> {
    return this.provinces.findStoriesForProvince(slug, query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Province detail — municipalities, stories, expenditure' })
  @ApiOkResponse({ type: ProvinceDetailDto })
  findOne(@Param('slug') slug: string): Promise<ProvinceDetailDto> {
    return this.provinces.findBySlug(slug);
  }
}
