import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { NewsletterService } from './newsletter.service';

/** Monday 04:00 UTC = 06:00 SAST — weekly digest to active subscribers. */
@Injectable()
export class NewsletterSchedulerService {
  private readonly logger = new Logger(NewsletterSchedulerService.name);
  private readonly enabled: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly newsletter: NewsletterService,
  ) {
    this.enabled =
      this.config.get<string>('NEWSLETTER_ENABLED')?.trim() === 'true';
  }

  @Cron('0 4 * * 1')
  async scheduledWeeklyDigest(): Promise<void> {
    if (!this.enabled) {
      return;
    }
    this.logger.log('Starting scheduled weekly digest…');
    try {
      await this.newsletter.sendWeeklyDigest();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Weekly digest failed: ${message}`);
    }
  }
}
