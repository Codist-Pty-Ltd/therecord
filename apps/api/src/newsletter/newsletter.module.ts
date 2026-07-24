import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Story } from '../entities/story.entity';
import { Subscriber } from '../entities/subscriber.entity';
import { NewsletterController } from './newsletter.controller';
import { NewsletterSchedulerService } from './newsletter-scheduler.service';
import { NewsletterService } from './newsletter.service';

@Module({
  imports: [TypeOrmModule.forFeature([Subscriber, Story])],
  controllers: [NewsletterController],
  providers: [NewsletterService, NewsletterSchedulerService],
  exports: [NewsletterService],
})
export class NewsletterModule {}
