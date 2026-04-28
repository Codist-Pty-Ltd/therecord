import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { IngestionApiKeyGuard } from '../auth/ingestion-api-key.guard';
import { IntelligenceClient } from '../intelligence/intelligence.client';
import { IngestArticleDto } from './dto/ingest-article.dto';
import type {
  IngestionResultDto,
  SimplifyLawSectionResultDto,
} from './dto/ingestion-result.dto';
import { IngestionService } from './ingestion.service';

/**
 * Operator-facing ingestion surface.
 *
 * Endpoints:
 *   POST /api/ingestion/article
 *     Run the full pipeline over one raw article. Returns the ingestion
 *     trace (story decision, extracted entities, legal refs, people linked,
 *     optional simplify result, warnings).
 *
 *   POST /api/ingestion/simplify/law-section/:id
 *     Backfill a LawSection's `plain_english` via Claude. Refuses to
 *     overwrite an existing non-empty value unless `?overwrite=true`.
 *
 *   GET /api/ingestion/intelligence/health
 *     Proxy to the FastAPI `/health` endpoint so operators can confirm
 *     the NLP service is reachable without leaving the NestJS perimeter.
 *
 * POST routes require `x-ingestion-key` matching `INGESTION_API_KEY`.
 * `GET /api/ingestion/intelligence/health` stays unauthenticated for probes.
 */
@ApiTags('ingestion')
@Controller('ingestion')
@UseGuards(IngestionApiKeyGuard)
export class IngestionController {
  constructor(
    private readonly ingestion: IngestionService,
    private readonly intelligence: IntelligenceClient,
  ) {}

  @Post('article')
  @HttpCode(HttpStatus.CREATED)
  @ApiHeader({
    name: 'x-ingestion-key',
    required: true,
    description: 'Must match the API `INGESTION_API_KEY` environment variable.',
  })
  @ApiOperation({
    summary: 'Ingest a raw article end-to-end (NER → cluster → persist).',
  })
  @ApiBody({ type: IngestArticleDto })
  async ingestArticle(
    @Body() dto: IngestArticleDto,
  ): Promise<IngestionResultDto> {
    return this.ingestion.ingestArticle(dto);
  }

  @Post('simplify/law-section/:id')
  @HttpCode(HttpStatus.OK)
  @ApiHeader({
    name: 'x-ingestion-key',
    required: true,
    description: 'Must match the API `INGESTION_API_KEY` environment variable.',
  })
  @ApiOperation({
    summary:
      'Generate (or refresh) the plain-English gloss of a LawSection via Claude.',
  })
  async simplifyLawSection(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query(
      'overwrite',
      new ParseBoolPipe({ optional: true }),
    )
    overwrite?: boolean,
  ): Promise<SimplifyLawSectionResultDto> {
    return this.ingestion.simplifyLawSection(id, overwrite ?? false);
  }

  @Get('intelligence/health')
  @ApiOperation({
    summary: 'Proxy the FastAPI /health endpoint so operators can probe it.',
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        reachable: { type: 'boolean' },
        status: { type: 'string' },
      },
    },
  })
  async intelligenceHealth(): Promise<{ reachable: boolean; status: string }> {
    return this.intelligence.health();
  }
}
