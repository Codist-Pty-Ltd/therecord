import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { AccountabilityBodiesService } from './accountability-bodies.service';
import {
  AccountabilityBodiesCompareQueryDto,
  AccountabilityBodyCasesListResponseDto,
  AccountabilityBodyCasesQueryDto,
  AccountabilityBodyCompareResponseDto,
  AccountabilityBodyDetailDto,
  AccountabilityBodyListQueryDto,
  AccountabilityBodyResponseDto,
  AccountabilityBodyTimelineResponseDto,
} from './dto/accountability-body.dto';

@ApiTags('Accountability bodies')
@Controller('accountability-bodies')
export class AccountabilityBodiesController {
  constructor(private readonly bodies: AccountabilityBodiesService) {}

  @Get()
  @ApiOperation({ summary: 'List accountability bodies (Scorpions, Hawks, IDAC, …)' })
  @ApiOkResponse({ type: [AccountabilityBodyResponseDto] })
  findAll(@Query() query: AccountabilityBodyListQueryDto): Promise<AccountabilityBodyResponseDto[]> {
    return this.bodies.findAll(query);
  }

  @Get('compare')
  @ApiOperation({ summary: 'Side-by-side comparison of bodies by slug' })
  @ApiOkResponse({ type: AccountabilityBodyCompareResponseDto })
  compare(
    @Query() query: AccountabilityBodiesCompareQueryDto,
  ): Promise<AccountabilityBodyCompareResponseDto> {
    return this.bodies.compare(query);
  }

  @Get(':slug/cases')
  @ApiOperation({ summary: 'Cases handled by this body' })
  @ApiParam({ name: 'slug', example: 'scorpions-dso' })
  @ApiOkResponse({ type: AccountabilityBodyCasesListResponseDto })
  findCases(
    @Param('slug') slug: string,
    @Query() query: AccountabilityBodyCasesQueryDto,
  ): Promise<AccountabilityBodyCasesListResponseDto> {
    return this.bodies.findCasesForSlug(slug, query);
  }

  @Get(':slug/timeline')
  @ApiOperation({
    summary: 'Timeline events from all stories linked to this body',
  })
  @ApiParam({ name: 'slug', example: 'scorpions-dso' })
  @ApiOkResponse({ type: AccountabilityBodyTimelineResponseDto })
  timeline(@Param('slug') slug: string): Promise<AccountabilityBodyTimelineResponseDto> {
    return this.bodies.timeline(slug);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Accountability body detail' })
  @ApiParam({ name: 'slug', example: 'scorpions-dso' })
  @ApiOkResponse({ type: AccountabilityBodyDetailDto })
  findOne(@Param('slug') slug: string): Promise<AccountabilityBodyDetailDto> {
    return this.bodies.findBySlug(slug);
  }
}
