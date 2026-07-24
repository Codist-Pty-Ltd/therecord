import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentQueueItem } from '../entities/content-queue-item.entity';
import { IntelligenceModule } from '../intelligence/intelligence.module';
import { StoriesModule } from '../stories/stories.module';
import { ContentAgentsSchedulerService } from './content-agents-scheduler.service';
import { ContentQueueController } from './content-queue.controller';
import { ContentQueueService } from './content-queue.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContentQueueItem]),
    StoriesModule,
    IntelligenceModule,
  ],
  controllers: [ContentQueueController],
  providers: [ContentQueueService, ContentAgentsSchedulerService],
  exports: [ContentQueueService],
})
export class ContentQueueModule {}
