import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Request } from 'express';
import { timingSafeEqual } from 'node:crypto';

/**
 * Protects {@link IngestionController} routes. Clients must send
 * `x-ingestion-key` matching `INGESTION_API_KEY` from the environment.
 *
 * `GET /api/ingestion/intelligence/health` is excluded here — that probe stays
 * unauthenticated so operators
 * can check NLP reachability without a secret. (See {@link isPublicIngestionRoute}.)
 */
@Injectable()
export class IngestionApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (isPublicIngestionRoute(request)) {
      return true;
    }

    const expected = this.config.get<string>('INGESTION_API_KEY')?.trim() ?? '';
    const provided = readIngestionKeyHeader(request);

    if (!expected) {
      throw new UnauthorizedException(
        'Ingestion API key is not configured (INGESTION_API_KEY).',
      );
    }

    if (!timingSafeEqualString(provided, expected)) {
      throw new UnauthorizedException('Invalid or missing x-ingestion-key.');
    }

    return true;
  }
}

function isPublicIngestionRoute(request: Request): boolean {
  if (request.method !== 'GET') {
    return false;
  }
  const path = request.path || request.url?.split('?')[0] || '';
  return path.endsWith('/ingestion/intelligence/health');
}

function readIngestionKeyHeader(request: Request): string {
  const raw = request.headers['x-ingestion-key'];
  if (typeof raw === 'string') {
    return raw.trim();
  }
  if (Array.isArray(raw) && raw[0] !== undefined) {
    return raw[0].trim();
  }
  return '';
}

/**
 * Constant-time compare when lengths match; otherwise `false` (length difference
 * is a minor side-channel, acceptable for static-format API keys).
 */
function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}
