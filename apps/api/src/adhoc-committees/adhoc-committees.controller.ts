import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AdhocCommitteesService } from './adhoc-committees.service';
import { AdhocCommitteeQueryDto } from './dto/adhoc-committee-query.dto';
import {
  AdhocCommitteeDetailResponseDto,
  AdhocCommitteeListResponseDto,
  AdhocCommitteesByParliamentResponseDto,
} from './dto/adhoc-committee-response.dto';

/**
 * Ad Hoc Parliamentary Committees. Mirrors the shape of the Commissions
 * controller so the frontend can treat both executive and legislative
 * oversight with the same UI primitives, while keeping the two
 * accountability mechanisms in separate URL spaces.
 */
@ApiTags('Ad Hoc Committees')
@Controller('adhoc-committees')
export class AdhocCommitteesController {
  constructor(private readonly committees: AdhocCommitteesService) {}

  @Get()
  @ApiOperation({
    summary: 'List ad hoc committees',
    description:
      'Paginated list of Parliamentary Ad Hoc Committees. Filterable by ' +
      'domain, status, category, parliament_term, and is_joint_committee. ' +
      'Ordered by announced_date (newest first), then by created_at.',
  })
  @ApiOkResponse({ type: AdhocCommitteeListResponseDto })
  async findAll(
    @Query() query: AdhocCommitteeQueryDto,
  ): Promise<AdhocCommitteeListResponseDto> {
    return this.committees.findAll(query);
  }

  @Get('by-parliament/:term')
  @ApiOperation({
    summary: 'List committees struck by a given Parliament',
    description:
      'All ad hoc committees whose `parliament_term` matches `:term`. ' +
      'Accepts either the canonical form ("7th Parliament") or a URL-safe ' +
      'variant ("7th-parliament") — both resolve to the same record set. ' +
      'Unpaginated: the number of ad hoc committees per Parliament is ' +
      'bounded by NA scheduling in practice (a few dozen at most).',
  })
  @ApiParam({
    name: 'term',
    example: '7th-parliament',
    description: 'Canonical or slug form, e.g. "7th Parliament" or "7th-parliament".',
  })
  @ApiOkResponse({ type: AdhocCommitteesByParliamentResponseDto })
  async findByParliament(
    @Param('term') term: string,
  ): Promise<AdhocCommitteesByParliamentResponseDto> {
    return this.committees.findByParliament(term);
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Get full ad hoc committee by slug',
    description:
      'Returns a committee with its linked stories (ordered by latest event), ' +
      'people grouped by role, law sections grouped by usage_type, the ' +
      'paired commission (if any), and a unified timeline reconstructed ' +
      'from every linked story.',
  })
  @ApiParam({ name: 'slug', example: 'mkhwanazi-adhoc-committee' })
  @ApiOkResponse({ type: AdhocCommitteeDetailResponseDto })
  async findBySlug(
    @Param('slug') slug: string,
  ): Promise<AdhocCommitteeDetailResponseDto> {
    return this.committees.findBySlug(slug);
  }
}
