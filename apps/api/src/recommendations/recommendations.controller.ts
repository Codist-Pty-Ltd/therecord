import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GlobalRecommendationStatsDto } from './dto/recommendation.dto';
import { RecommendationsService } from './recommendations.service';

@ApiTags('Recommendations')
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendations: RecommendationsService) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Global recommendation statistics',
    description:
      'Aggregates implementation status and category across every recommendation ' +
      'in the database (commissions and ad hoc committees).',
  })
  @ApiOkResponse({ type: GlobalRecommendationStatsDto })
  async globalStats(): Promise<GlobalRecommendationStatsDto> {
    return this.recommendations.getGlobalStats();
  }
}
