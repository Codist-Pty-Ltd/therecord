import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { SiuProclamationQueryDto } from './dto/siu-proclamation-query.dto';
import {
  SiuOverviewResponseDto,
  SiuProclamationDetailResponseDto,
  SiuProclamationListResponseDto,
  SiuStatsDto,
  SpecialTribunalCaseDetailResponseDto,
  SpecialTribunalOverviewResponseDto,
} from './dto/siu-response.dto';
import { TribunalCaseQueryDto } from './dto/tribunal-case-query.dto';
import { SiuService } from './siu.service';

/**
 * Special Investigating Unit endpoints.
 *
 * Route order matters in NestJS: `/siu/proclamations` and `/siu/tribunal`
 * (the static-segment routes) are declared *before* `/siu/proclamations/:slug`
 * and `/siu/tribunal/:caseNumber` (the dynamic-segment routes), and
 * `/siu/stats` sits in its own slot. Within each path family, more
 * specific patterns come first so they are matched first.
 */
@ApiTags('SIU')
@Controller('siu')
export class SiuController {
  constructor(private readonly siu: SiuService) {}

  @Get()
  @ApiOperation({
    summary: 'SIU body info + headline accountability stats',
    description:
      'Returns the singleton SIU institutional record together with ' +
      'aggregate stats: total proclamations, active count, total Rand ' +
      'recovered, total Tribunal cases, and downstream referral counts.',
  })
  @ApiOkResponse({ type: SiuOverviewResponseDto })
  async getOverview(): Promise<SiuOverviewResponseDto> {
    return this.siu.getOverview();
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Aggregate stats only',
    description:
      'Same stats payload as `/siu` without the body metadata. Useful ' +
      'for cheaper polling from dashboards.',
  })
  @ApiOkResponse({ type: SiuStatsDto })
  async getStats(): Promise<SiuStatsDto> {
    return this.siu.getStats();
  }

  @Get('proclamations')
  @ApiOperation({
    summary: 'List Presidential proclamations',
    description:
      'Paginated list of every Presidential proclamation activating an ' +
      'SIU investigation. Filterable by `status`, `domain` and ' +
      '`president_who_signed`. Ordered by `signed_date` DESC (newest first).',
  })
  @ApiOkResponse({ type: SiuProclamationListResponseDto })
  async listProclamations(
    @Query() query: SiuProclamationQueryDto,
  ): Promise<SiuProclamationListResponseDto> {
    return this.siu.findAllProclamations(query);
  }

  @Get('proclamations/:slug')
  @ApiOperation({
    summary: 'Get a proclamation by slug',
    description:
      'Returns a proclamation with its investigation outcome (financial + ' +
      'referral figures), all Special Tribunal cases filed under it, all ' +
      'linked stories ordered chronologically, all implicated / referred / ' +
      'convicted persons, and any paired commission or ad hoc committee.',
  })
  @ApiParam({
    name: 'slug',
    example: 'proclamation-r23-2020-ppe',
  })
  @ApiOkResponse({ type: SiuProclamationDetailResponseDto })
  async getProclamation(
    @Param('slug') slug: string,
  ): Promise<SiuProclamationDetailResponseDto> {
    return this.siu.findProclamationBySlug(slug);
  }

  @Get('tribunal')
  @ApiOperation({
    summary: 'Special Tribunal info + every civil case',
    description:
      'Returns the singleton Tribunal record together with every civil ' +
      'matter filed under it, sorted by claim value (largest first). ' +
      'Filterable by status. Unpaginated — the docket is bounded.',
  })
  @ApiOkResponse({ type: SpecialTribunalOverviewResponseDto })
  async getTribunal(
    @Query() query: TribunalCaseQueryDto,
  ): Promise<SpecialTribunalOverviewResponseDto> {
    return this.siu.getTribunalOverview(query);
  }

  @Get('tribunal/:caseNumber')
  @ApiOperation({
    summary: 'Get a Special Tribunal case by case number',
    description:
      'Accepts both the canonical case number with the slash URL-encoded ' +
      '(`GP01%2F2021`) and a slug-style form with the slash replaced by ' +
      'a hyphen (`gp01-2021`). Returns the case plus the parent ' +
      'proclamation summary for navigation context.',
  })
  @ApiParam({
    name: 'caseNumber',
    example: 'gp01-2021',
    description: 'Either `GP01%2F2021` (URL-encoded) or `gp01-2021` (slug form).',
  })
  @ApiOkResponse({ type: SpecialTribunalCaseDetailResponseDto })
  async getTribunalCase(
    @Param('caseNumber') caseNumber: string,
  ): Promise<SpecialTribunalCaseDetailResponseDto> {
    return this.siu.findTribunalCaseByNumber(caseNumber);
  }
}
