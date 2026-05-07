import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HumanImpactModule } from '../human-impact/human-impact.module';
import { AccountabilityBody } from '../entities/accountability-body.entity';
import { AccountabilityBodyCase } from '../entities/accountability-body-case.entity';
import { Article } from '../entities/article.entity';
import { EventLegalReference } from '../entities/event_legal_reference.entity';
import { Investigation } from '../entities/investigation.entity';
import { Municipality } from '../entities/municipality.entity';
import { Province } from '../entities/province.entity';
import { PublicExpenditureRecord } from '../entities/public-expenditure-record.entity';
import { SimilarStory } from '../entities/similar-story.entity';
import { Story } from '../entities/story.entity';
import { StoryPerson } from '../entities/story_person.entity';
import { TimelineEvent } from '../entities/timeline_event.entity';
import { TransformationPolicy } from '../entities/transformation-policy.entity';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';

@Module({
  imports: [
    HumanImpactModule,
    TypeOrmModule.forFeature([
      Story,
      TransformationPolicy,
      TimelineEvent,
      StoryPerson,
      Investigation,
      Article,
      EventLegalReference,
      Province,
      Municipality,
      PublicExpenditureRecord,
      SimilarStory,
      AccountabilityBody,
      AccountabilityBodyCase,
    ]),
  ],
  controllers: [StoriesController],
  providers: [StoriesService],
  exports: [StoriesService],
})
export class StoriesModule {}
