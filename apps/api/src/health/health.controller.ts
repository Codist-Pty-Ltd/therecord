import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { HealthApiKeyGuard } from './health-api-key.guard';
import { HealthService } from './health.service';

/**
 * Liveness and operator diagnostics. `GET /` is unauthenticated; `GET /full`
 * requires `x-health-key` and must never be exposed on the public internet
 * without TLS + network controls.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Lightweight liveness (load balancers, CI, uptime monitors)' })
  @ApiOkResponse({
    schema: {
      example: { status: 'ok', timestamp: '2025-01-15T10:00:00.000Z', uptime: 3600 },
    },
  })
  getHealth(): { status: 'ok'; timestamp: string; uptime: number } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: this.health.getUptimeSeconds(),
    };
  }

  @Get('full')
  @UseGuards(HealthApiKeyGuard)
  @ApiHeader({
    name: 'x-health-key',
    required: true,
    description: 'Must match the API `HEALTH_API_KEY` environment variable.',
  })
  @ApiOperation({
    summary: 'Full dependency checks (database, intelligence, ingestion, stories)',
  })
  @ApiProduces('application/json')
  getFullHealth() {
    return this.health.getFullHealth();
  }
}
