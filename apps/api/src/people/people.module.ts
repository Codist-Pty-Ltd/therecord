import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionPerson } from '../entities/commission_person.entity';
import { Person } from '../entities/person.entity';
import { StoryPerson } from '../entities/story_person.entity';
import { TimelineEvent } from '../entities/timeline_event.entity';
import { PeopleController } from './people.controller';
import { PeopleService } from './people.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Person,
      StoryPerson,
      CommissionPerson,
      TimelineEvent,
    ]),
  ],
  controllers: [PeopleController],
  providers: [PeopleService],
  exports: [PeopleService],
})
export class PeopleModule {}
