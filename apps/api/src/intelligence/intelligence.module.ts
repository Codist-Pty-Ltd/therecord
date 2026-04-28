import { Module } from '@nestjs/common';
import { IntelligenceClient } from './intelligence.client';

/**
 * Standalone module whose only job is to publish `IntelligenceClient` into
 * the DI container. Anything that needs to call the FastAPI service imports
 * this module and injects the client. There are no entities registered here
 * because the intelligence service is stateless — it doesn't own any tables.
 */
@Module({
  providers: [IntelligenceClient],
  exports: [IntelligenceClient],
})
export class IntelligenceModule {}
