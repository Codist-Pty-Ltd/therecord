import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImpactSector } from '../entities/impact-sector.entity';
import { Story } from '../entities/story.entity';
import { StoryImpactSector } from '../entities/story-impact-sector.entity';
import { StateEntity } from '../entities/state-entity.entity';
import { StateEntityCommissionLink } from '../entities/state-entity-commission-link.entity';
import { StateEntityTimeline } from '../entities/state-entity-timeline.entity';
import { StateEntitiesController } from './state-entities.controller';
import { StateEntitiesService } from './state-entities.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StateEntity,
      StateEntityTimeline,
      StateEntityCommissionLink,
      Story,
      ImpactSector,
      StoryImpactSector,
    ]),
  ],
  controllers: [StateEntitiesController],
  providers: [StateEntitiesService],
})
export class StateEntitiesModule {}
