import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { SearchQueryDto } from './dto/search-query.dto';
import { SearchResponseDto } from './dto/search-result.dto';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({
    summary: 'Full-text search across stories, people, commissions, and related entities',
    description:
      'Case-insensitive substring match (PostgreSQL ILIKE) over editorial fields. ' +
      '`types` is an optional comma-separated filter. Each type returns at most 5 matches; ' +
      'results are merged, sorted by recency, and paginated with `page` and `limit`. ' +
      'Empty query: no matches, HTTP 200 with an empty `results` array. ' +
      'Query string shorter than 2 characters: HTTP 400.',
  })
  @ApiOkResponse({ type: SearchResponseDto })
  search(@Query() query: SearchQueryDto): Promise<SearchResponseDto> {
    return this.searchService.search(query);
  }
}
