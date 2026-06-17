import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  ClusterMatchResult,
  ExtractEntitiesResult,
  IntelligenceAskResult,
  LegalMapResult,
  ReadingLevel,
  SimplifyResult,
  StoryCandidate,
} from './dto/intelligence.dto';
import type { YoutubeScoredVideoDto } from './dto/youtube-scored.dto';

/**
 * Typed HTTP client for the FastAPI intelligence service.
 *
 * Everything that NestJS wants to do with NLP / Claude / legal mapping goes
 * through here. The rest of the API must not know the wire format, the
 * hostnames, or the failure modes — only what to *ask* for.
 *
 * Design rules:
 *   - Never throw a raw `Error`; map transport failures to Nest HTTP
 *     exceptions so the controller layer returns a meaningful status.
 *   - Use `AbortController` to cap every call at a strict client-side
 *     timeout; the FastAPI service is a shared resource and a slow hang
 *     must never wedge the API.
 *   - Log every outbound call's endpoint + duration at debug level. Don't
 *     log request bodies (they routinely contain full article text).
 */
@Injectable()
export class IntelligenceClient {
  private readonly logger = new Logger(IntelligenceClient.name);
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(config: ConfigService) {
    // Strip a trailing slash so we can always `${baseUrl}/api/...`.
    this.baseUrl = (
      config.get<string>('INTELLIGENCE_URL') ?? 'http://intelligence:8001'
    ).replace(/\/+$/, '');

    const raw = config.get<string>('INTELLIGENCE_TIMEOUT_MS');
    const parsed = raw ? Number(raw) : Number.NaN;
    this.timeoutMs =
      Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 30_000;
  }

  /** GET /health — cheap liveness probe. Returns `true` when the service replies ok. */
  async health(): Promise<{ reachable: boolean; status: string }> {
    try {
      const response = await this.request<{ status: string }>(
        '/health',
        'GET',
      );
      return { reachable: true, status: response.status };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { reachable: false, status: message };
    }
  }

  async extractEntities(text: string): Promise<ExtractEntitiesResult> {
    return this.request<ExtractEntitiesResult>('/api/entities/extract', 'POST', {
      text,
    });
  }

  async mapLegal(
    crimesAlleged: string[],
    context = '',
  ): Promise<LegalMapResult> {
    return this.request<LegalMapResult>('/api/legal/map', 'POST', {
      crimes_alleged: crimesAlleged,
      context,
    });
  }

  async clusterMatch(
    headline: string,
    text: string,
    storyCandidates: StoryCandidate[],
  ): Promise<ClusterMatchResult> {
    return this.request<ClusterMatchResult>('/api/cluster/match', 'POST', {
      headline,
      text,
      story_candidates: storyCandidates,
    });
  }

  async simplify(text: string, level: ReadingLevel): Promise<SimplifyResult> {
    return this.request<SimplifyResult>('/api/summary/simplify', 'POST', {
      text,
      level,
    });
  }

  async discoverYoutube(body: {
    entity_type: string;
    entity_id: string;
    entity_name: string;
    search_queries: string[];
    max_results_per_query?: number;
    commission_key?: string;
    chair_name?: string;
    domain_keyword?: string;
    announced_year?: string;
  }): Promise<YoutubeScoredVideoDto[]> {
    return this.request<YoutubeScoredVideoDto[]>('/api/youtube/discover', 'POST', body);
  }

  async ask(
    query: string,
    opts?: {
      topK?: number;
      minSimilarity?: number;
      sourceTypes?: string[];
    },
  ): Promise<IntelligenceAskResult> {
    return this.request<IntelligenceAskResult>('/api/rag/ask', 'POST', {
      query,
      top_k: opts?.topK,
      min_similarity: opts?.minSimilarity,
      source_types: opts?.sourceTypes,
    });
  }

  /* ------------------------------------------------------- internals */

  private async request<T>(
    path: string,
    method: 'GET' | 'POST',
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    const started = Date.now();

    try {
      const response = await fetch(url, {
        method,
        signal: controller.signal,
        headers: body
          ? { 'content-type': 'application/json', accept: 'application/json' }
          : { accept: 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });

      const durationMs = Date.now() - started;
      this.logger.debug(
        `${method} ${path} → ${response.status} in ${durationMs}ms`,
      );

      if (!response.ok) {
        const detail = await safeReadText(response);
        // 503 from FastAPI (e.g. no ANTHROPIC_API_KEY) is a dependency problem,
        // not a bug in our controller — surface it verbatim.
        if (response.status === 503) {
          throw new ServiceUnavailableException(
            `Intelligence service returned 503: ${detail || 'dependency unavailable'}`,
          );
        }
        throw new BadGatewayException(
          `Intelligence ${method} ${path} failed (${response.status}): ${
            detail || response.statusText
          }`,
        );
      }

      return (await response.json()) as T;
    } catch (err) {
      if (isAbortError(err)) {
        throw new BadGatewayException(
          `Intelligence ${method} ${path} timed out after ${this.timeoutMs}ms.`,
        );
      }
      // Nest exceptions from the !ok branch above already have the right shape.
      if (
        err instanceof BadGatewayException ||
        err instanceof ServiceUnavailableException
      ) {
        throw err;
      }
      const message = err instanceof Error ? err.message : String(err);
      throw new BadGatewayException(
        `Intelligence ${method} ${path} failed before response: ${message}`,
      );
    } finally {
      clearTimeout(timer);
    }
  }
}

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

async function safeReadText(response: Response): Promise<string> {
  try {
    const text = await response.text();
    // Trim to keep log volume sane — FastAPI validation errors are verbose.
    return text.length > 500 ? `${text.slice(0, 500)}…` : text;
  } catch {
    return '';
  }
}
