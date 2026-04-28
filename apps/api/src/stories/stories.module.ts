import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from '../entities/article.entity';
import { EventLegalReference } from '../entities/event_legal_reference.entity';
import { Investigation } from '../entities/investigation.entity';
import { Story } from '../entities/story.entity';
import { StoryPerson } from '../entities/story_person.entity';
import { TimelineEvent } from '../entities/timeline_event.entity';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Story,
      TimelineEvent,
      StoryPerson,
      Investigation,
      Article,
      EventLegalReference,
    ]),
  ],
  controllers: [StoriesController],
  providers: [StoriesService],
  exports: [StoriesService],
})
export class StoriesModule {}
