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
} from './dto/commission-response.dto';

@ApiTags('Commissions')
@Controller('commissions')
export class CommissionsController {
  constructor(private readonly commissions: CommissionsService) {}

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

  @Get(':slug')
  @ApiOperation({
    summary: 'Get full commission by slug',
    description:
      'Returns a commission with its linked stories (ordered by latest event), ' +
      'people (grouped by role), law sections (grouped by usage_type), and a ' +
      'unified timeline reconstructed from every linked story.',
  })
  @ApiParam({ name: 'slug', example: 'zondo-commission' })
  @ApiOkResponse({ type: CommissionDetailResponseDto })
  async findBySlug(
    @Param('slug') slug: string,
  ): Promise<CommissionDetailResponseDto> {
    return this.commissions.findBySlug(slug);
  }
}
