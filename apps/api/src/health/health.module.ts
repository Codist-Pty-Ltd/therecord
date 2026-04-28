import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { HealthApiKeyGuard } from './health-api-key.guard';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [ConfigModule],
  controllers: [HealthController],
  providers: [HealthService, HealthApiKeyGuard],
})
export class HealthModule {}
