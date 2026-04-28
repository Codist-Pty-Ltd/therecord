import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

const DB_PING_TIMEOUT_MS = 2_000;
const INTELLIGENCE_HEALTH_TIMEOUT_MS = 3_000;

export type OverallHealthStatus = 'ok' | 'degraded' | 'down';

export interface FullHealthPayload {
  status: OverallHealthStatus;
  timestamp: string;
  uptime: number;
  checks: {
    database: {
      status: 'ok' | 'error';
      latency_ms: number;
      message?: string;
    };
    intelligence: {
      status: 'ok' | 'error' | 'unknown';
      latency_ms: number;
      message?: string;
    };
    ingestion: {
      status: 'ok' | 'stale' | 'disabled';
      last_article_ingested_at: string | null;
      hours_since_last_ingest: number | null;
      is_stale: boolean;
    };
    stories: {
      total: number;
      active: number;
      last_updated_at: string;
    };
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  getUptimeSeconds(): number {
    return Math.floor(process.uptime());
  }

  async getFullHealth(): Promise<FullHealthPayload> {
    const timestamp = new Date().toISOString();
    const uptime = this.getUptimeSeconds();

    const database = await this.pingDatabase();
    if (database.check.status === 'error') {
      return {
        status: 'down',
        timestamp,
        uptime,
        checks: {
          database: database.check,
          intelligence: {
            status: 'unknown',
            latency_ms: 0,
            message: 'Skipped — database unavailable',
          },
          ingestion: {
            status: 'disabled',
            last_article_ingested_at: null,
            hours_since_last_ingest: null,
            is_stale: false,
          },
          stories: { total: 0, active: 0, last_updated_at: new Date(0).toISOString() },
        },
      };
    }

    const [intelligence, ingestionMeta, storyStats] = await Promise.all([
      this.pingIntelligence(),
      this.getIngestionMeta(),
      this.getStoryStats(),
    ]);

    const overall = this.resolveOverallStatus(database, intelligence, ingestionMeta);

    return {
      status: overall,
      timestamp,
      uptime,
      checks: {
        database: database.check,
        intelligence: intelligence.check,
        ingestion: ingestionMeta,
        stories: storyStats,
      },
    };
  }

  private resolveOverallStatus(
    database: { check: FullHealthPayload['checks']['database'] },
    intelligence: { check: FullHealthPayload['checks']['intelligence'] },
    ingestion: FullHealthPayload['checks']['ingestion'],
  ): OverallHealthStatus {
    if (database.check.status === 'error') {
      return 'down';
    }
    if (intelligence.check.status === 'error' || ingestion.status === 'stale') {
      return 'degraded';
    }
    return 'ok';
  }

  private async pingDatabase(): Promise<{
    check: FullHealthPayload['checks']['database'];
  }> {
    const started = Date.now();
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error('Database ping timed out after 2s')),
        DB_PING_TIMEOUT_MS,
      );
    });
    try {
      await Promise.race([this.dataSource.query('SELECT 1'), timeout]);
      const latency_ms = Date.now() - started;
      return { check: { status: 'ok', latency_ms } };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Database health check failed: ${message}`);
      const latency_ms = Date.now() - started;
      return {
        check: {
          status: 'error',
          latency_ms,
          message,
        },
      };
    }
  }

  private async pingIntelligence(): Promise<{
    check: FullHealthPayload['checks']['intelligence'];
  }> {
    const raw = this.config.get<string>('INTELLIGENCE_URL')?.trim();
    const base = (raw && raw.length > 0
      ? raw
      : 'http://intelligence:8001'
    ).replace(/\/+$/, '');

    const url = `${base}/health`;
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      INTELLIGENCE_HEALTH_TIMEOUT_MS,
    );
    try {
      const res = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: { accept: 'application/json' },
      });
      const latency_ms = Date.now() - started;
      if (!res.ok) {
        return {
          check: {
            status: 'error',
            latency_ms,
            message: `Intelligence /health returned ${res.status}`,
          },
        };
      }
      return { check: { status: 'ok', latency_ms } };
    } catch (err) {
      const latency_ms = Date.now() - started;
      const isAbort = err instanceof Error && err.name === 'AbortError';
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Intelligence health check failed: ${msg}`);
      return {
        check: {
          status: 'error',
          latency_ms,
          message: isAbort
            ? 'Intelligence service unreachable'
            : `Intelligence service unreachable (${msg})`,
        },
      };
    } finally {
      clearTimeout(timer);
    }
  }

  private async getIngestionMeta(): Promise<FullHealthPayload['checks']['ingestion']> {
    const ingestionEnabled =
      this.config.get<string>('INGESTION_ENABLED') === 'true';

    const rawThreshold = this.config.get<string>('STALE_THRESHOLD_HOURS');
    const parsed = rawThreshold ? Number(rawThreshold) : 4;
    const thresholdHours = Number.isFinite(parsed) && parsed > 0 ? parsed : 4;

    const row = (await this.dataSource.query(
      `SELECT MAX(created_at) AS m FROM articles`,
    )) as [{ m: Date | null }];

    const maxCreated: Date | null = row[0]?.m ?? null;
    const last_article_ingested_at = maxCreated
      ? new Date(maxCreated).toISOString()
      : null;

    let hours_since_last_ingest: number | null = null;
    if (maxCreated) {
      hours_since_last_ingest =
        (Date.now() - new Date(maxCreated).getTime()) / 3_600_000;
    }

    const neverIngested = maxCreated == null;
    const is_stale = neverIngested
      ? ingestionEnabled
      : (hours_since_last_ingest != null
          && hours_since_last_ingest > thresholdHours);

    if (!ingestionEnabled) {
      return {
        status: 'disabled',
        last_article_ingested_at,
        hours_since_last_ingest,
        is_stale,
      };
    }
    if (is_stale) {
      return {
        status: 'stale',
        last_article_ingested_at,
        hours_since_last_ingest,
        is_stale: true,
      };
    }
    return {
      status: 'ok',
      last_article_ingested_at,
      hours_since_last_ingest,
      is_stale: false,
    };
  }

  private async getStoryStats(): Promise<FullHealthPayload['checks']['stories']> {
    const totalRow = (await this.dataSource.query(
      `SELECT COUNT(*)::int AS c FROM stories`,
    )) as [{ c: number }];
    const activeRow = (await this.dataSource.query(
      `SELECT COUNT(*)::int AS c FROM stories WHERE status = 'active'`,
    )) as [{ c: number }];
    const lastRow = (await this.dataSource.query(
      `SELECT MAX(updated_at) AS m FROM stories`,
    )) as [{ m: Date | null }];

    const total = totalRow[0]?.c ?? 0;
    const active = activeRow[0]?.c ?? 0;
    const m = lastRow[0]?.m;
    const last_updated_at = m
      ? new Date(m).toISOString()
      : new Date(0).toISOString();

    return { total, active, last_updated_at };
  }
}
