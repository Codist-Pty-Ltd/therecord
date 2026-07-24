import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { IntelligenceClient } from '../intelligence/intelligence.client';

/** Scheduled SIU + SAFLII content monitoring via FastAPI agents. */
@Injectable()
export class ContentAgentsSchedulerService {
  private readonly logger = new Logger(ContentAgentsSchedulerService.name);
  private readonly siuEnabled: boolean;
  private readonly safliiEnabled: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly intelligence: IntelligenceClient,
  ) {
    this.siuEnabled =
      this.config.get<string>('SIU_AGENT_ENABLED')?.trim() === 'true';
    this.safliiEnabled =
      this.config.get<string>('SAFLII_AGENT_ENABLED')?.trim() === 'true';
  }

  /** Monday 03:00 UTC = 05:00 SAST — after YouTube weekly job. */
  @Cron('0 3 * * 1')
  async scheduledSiuAgent(): Promise<void> {
    if (!this.siuEnabled) {
      return;
    }
    try {
      const result = await this.intelligence.runSiuAgent();
      this.logger.log(`SIU agent complete: ${JSON.stringify(result)}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`SIU agent failed: ${message}`);
    }
  }

  /** Daily 03:00 UTC = 05:00 SAST. */
  @Cron('0 3 * * *')
  async scheduledSafliiAgent(): Promise<void> {
    if (!this.safliiEnabled) {
      return;
    }
    try {
      const result = await this.intelligence.runSafliiAgent();
      this.logger.log(`SAFLII agent complete: ${JSON.stringify(result)}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`SAFLII agent failed: ${message}`);
    }
  }
}
