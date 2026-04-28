import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from '../entities/article.entity';
import { LawSection } from '../entities/law_section.entity';
import { Person } from '../entities/person.entity';
import { Story } from '../entities/story.entity';
import { StoryPerson } from '../entities/story_person.entity';
import { IngestionApiKeyGuard } from '../auth/ingestion-api-key.guard';
import { IntelligenceModule } from '../intelligence/intelligence.module';
import { IngestionController } from './ingestion.controller';
import { IngestionSchedulerService } from './ingestion-scheduler.service';
import { IngestionService } from './ingestion.service';

/**
 * Orchestration module: the only thing in the API that couples the FastAPI
 * NLP service to the persistence layer. Pulls its repositories via
 * `TypeOrmModule.forFeature` and the NLP client via `IntelligenceModule`.
 *
 * Includes the {@link IngestionSchedulerService} which polls the configured
 * RSS feeds every 15 minutes and feeds anything new through
 * {@link IngestionService}. The scheduler is gated behind
 * `INGESTION_ENABLED=true`; see its class doc for operational details.
 */
@Module({
  imports: [
    IntelligenceModule,
    TypeOrmModule.forFeature([Story, Article, Person, StoryPerson, LawSection]),
  ],
  controllers: [IngestionController],
  providers: [IngestionService, IngestionSchedulerService, IngestionApiKeyGuard],
  exports: [IngestionService],
})
export class IngestionModule {}
