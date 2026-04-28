import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';

/**
 * Protects `GET /api/health/full`. Clients must send `x-health-key`
 * matching `HEALTH_API_KEY` in the environment.
 */
@Injectable()
export class HealthApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('HEALTH_API_KEY')?.trim() ?? '';
    if (!expected) {
      throw new ServiceUnavailableException(
        'HEALTH_API_KEY is not configured. Full health is disabled.',
      );
    }
    const request = context.switchToHttp().getRequest<Request>();
    const provided = readHealthKeyHeader(request);
    if (!timingSafeEqualString(provided, expected)) {
      throw new UnauthorizedException('Invalid or missing x-health-key.');
    }
    return true;
  }
}

function readHealthKeyHeader(request: Request): string {
  const raw = request.headers['x-health-key'];
  if (typeof raw === 'string') return raw.trim();
  if (Array.isArray(raw) && raw[0] !== undefined) return raw[0].trim();
  return '';
}

function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}
