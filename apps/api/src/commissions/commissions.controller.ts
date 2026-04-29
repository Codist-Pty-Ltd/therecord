import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CommissionsService } from './commissions.service';
import {
  CommissionCompareQueryDto,
  CommissionCompareResponseDto,
} from './dto/commission-compare.dto';
import { CommissionQueryDto } from './dto/commission-query.dto';
import {
  CommissionDetailResponseDto,
  CommissionListResponseDto,
  CommissionReportsGroupedDto,
} from './dto/commission-response.dto';
import {
  CommissionRecommendationsQueryDto,
  CommissionRecommendationsResponseDto,
} from '../recommendations/dto/recommendation.dto';
import { RecommendationsService } from '../recommendations/recommendations.service';

@ApiTags('Commissions')
@Controller('commissions')
export class CommissionsController {
  constructor(
    private readonly commissions: CommissionsService,
    private readonly recommendations: RecommendationsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List commissions',
    description:
      'Paginated list of every commission on The Record. Filterable by domain and/or status. ' +
      'Ordered by announced date (newest first), then by creation date.',
  })
  @ApiOkResponse({ type: CommissionListResponseDto })
  async findAll(
    @Query() query: CommissionQueryDto,
  ): Promise<CommissionListResponseDto> {
    return this.commissions.findAll(query);
  }

  @Get('compare')
  @ApiOperation({
    summary: 'Compare two commissions',
    description:
      'Side-by-side comparison of two commissions by slug. Returns duration, cost, ' +
      'hearing days, prosecutions, laws invoked, and people implicated — plus a ' +
      '`delta` block for quick visual diffs on the frontend.',
  })
  @ApiOkResponse({ type: CommissionCompareResponseDto })
  async compare(
    @Query() query: CommissionCompareQueryDto,
  ): Promise<CommissionCompareResponseDto> {
    return this.commissions.compare(query);
  }

  @Get(':slug/recommendations')
  @ApiOperation({
    summary: 'List recommendations for a commission',
    description:
      'Filterable list of recommendations with implementation metadata. ' +
      '`status_counts` always reflects all recommendations for this commission; ' +
      'the `recommendations` array respects query filters.',
  })
  @ApiParam({ name: 'slug', example: 'zondo-commission-state-capture' })
  @ApiOkResponse({ type: CommissionRecommendationsResponseDto })
  async findRecommendationsBySlug(
    @Param('slug') slug: string,
    @Query() query: CommissionRecommendationsQueryDto,
  ): Promise<CommissionRecommendationsResponseDto> {
    return this.recommendations.findForCommissionBySlug(slug, query);
  }

  @Get(':slug/reports')
  @ApiOperation({
    summary: 'List official reports for a commission',
    description:
      'Returns PDF / report metadata for this commission, grouped by `report_type`. ' +
      'Rows are ordered within each group by volume number, then published date.',
  })
  @ApiParam({ name: 'slug', example: 'zondo-commission-state-capture' })
  @ApiOkResponse({ type: CommissionReportsGroupedDto })
  async findReportsBySlug(
    @Param('slug') slug: string,
  ): Promise<CommissionReportsGroupedDto> {
    return this.commissions.findReportsGroupedBySlug(slug);
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Get full commission by slug',
    description:
      'Returns a commission with its linked stories (ordered by latest event), ' +
      'people (grouped by role), law sections (grouped by usage_type), official ' +
      'reports (PDF metadata), recommendations (grouped summary + status counts), ' +
      'and a unified timeline reconstructed from every linked story.',
  })
  @ApiParam({ name: 'slug', example: 'zondo-commission' })
  @ApiOkResponse({ type: CommissionDetailResponseDto })
  async findBySlug(
    @Param('slug') slug: string,
  ): Promise<CommissionDetailResponseDto> {
    return this.commissions.findBySlug(slug);
  }
}
