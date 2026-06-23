import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { IntelligenceAskDto } from './dto/intelligence-ask.dto';
import {
  ExtractEntitiesDto,
  LegalMapDto,
  SimplifyDto,
} from './dto/intelligence-ops.dto';
import type {
  ExtractEntitiesResult,
  IntelligenceAskResult,
  LegalMapResult,
  SimplifyResult,
} from './dto/intelligence.dto';
import { IntelligenceCitationService } from './intelligence-citation.service';
import { IntelligenceClient } from './intelligence.client';

@ApiTags('intelligence')
@Controller('intelligence')
export class IntelligenceController {
  constructor(
    private readonly intelligence: IntelligenceClient,
    private readonly citations: IntelligenceCitationService,
  ) {}

  @Post('entities/extract')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Extract people, orgs, crimes from text (proxies to FastAPI)' })
  extract(@Body() dto: ExtractEntitiesDto): Promise<ExtractEntitiesResult> {
    return this.intelligence.extractEntities(dto.text);
  }

  @Post('legal/map')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Map alleged crimes to SA statutes (proxies to FastAPI)' })
  mapLegal(@Body() dto: LegalMapDto): Promise<LegalMapResult> {
    return this.intelligence.mapLegal(dto.crimes_alleged, dto.context ?? '');
  }

  @Post('summary/simplify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Plain-English rewrite at a reading level (proxies to FastAPI)' })
  simplify(@Body() dto: SimplifyDto): Promise<SimplifyResult> {
    return this.intelligence.simplify(dto.text, dto.level);
  }

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
