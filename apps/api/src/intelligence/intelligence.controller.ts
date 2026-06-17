import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { IntelligenceAskDto } from './dto/intelligence-ask.dto';
import type { IntelligenceAskResult } from './dto/intelligence.dto';
import { IntelligenceCitationService } from './intelligence-citation.service';
import { IntelligenceClient } from './intelligence.client';

@ApiTags('intelligence')
@Controller('intelligence')
export class IntelligenceController {
  constructor(
    private readonly intelligence: IntelligenceClient,
    private readonly citations: IntelligenceCitationService,
  ) {}

  @Post('ask')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ask a grounded question over The Record corpus',
    description:
      'Proxies to the FastAPI intelligence service (`POST /api/rag/ask`). ' +
      'Returns an answer with citations when retrieval is strong enough; otherwise an honest refusal.',
  })
  @ApiOkResponse({ description: 'Grounded answer with citations and retrieved source chunks' })
  async ask(@Body() dto: IntelligenceAskDto): Promise<IntelligenceAskResult> {
    const result = await this.intelligence.ask(dto.query, {
      topK: dto.topK,
      minSimilarity: dto.minSimilarity,
      sourceTypes: dto.sourceTypes,
    });
    const enriched = await this.citations.enrichCitations(result.citations);
    return { ...result, citations: enriched };
  }
}
