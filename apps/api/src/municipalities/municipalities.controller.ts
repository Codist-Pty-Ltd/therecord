import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { MunicipalityListQueryDto } from './dto/municipality-list-query.dto';
import { MunicipalityDetailDto, MunicipalityListItemDto } from './dto/municipality-response.dto';
import { MunicipalitiesService } from './municipalities.service';

@ApiTags('Municipalities')
@Controller('municipalities')
export class MunicipalitiesController {
  constructor(private readonly municipalities: MunicipalitiesService) {}

  @Get()
  @ApiOperation({ summary: 'List municipalities (filter by province, type, audit outcome)' })
  @ApiOkResponse({ type: [MunicipalityListItemDto] })
  findAll(@Query() query: MunicipalityListQueryDto): Promise<MunicipalityListItemDto[]> {
    return this.municipalities.findAll(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Municipality detail with stories and tracked money' })
  @ApiOkResponse({ type: MunicipalityDetailDto })
  findOne(@Param('slug') slug: string): Promise<MunicipalityDetailDto> {
    return this.municipalities.findBySlug(slug);
  }
}
