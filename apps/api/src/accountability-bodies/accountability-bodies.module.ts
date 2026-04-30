import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Commission } from '../entities/commission.entity';
import { AccountabilityBody } from '../entities/accountability-body.entity';
import { AccountabilityBodyCase } from '../entities/accountability-body-case.entity';
import { Story } from '../entities/story.entity';
import { TimelineEvent } from '../entities/timeline_event.entity';
import { AccountabilityBodiesController } from './accountability-bodies.controller';
import { AccountabilityBodiesService } from './accountability-bodies.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AccountabilityBody,
      AccountabilityBodyCase,
      Story,
      TimelineEvent,
      Commission,
    ]),
  ],
  controllers: [AccountabilityBodiesController],
  providers: [AccountabilityBodiesService],
  exports: [AccountabilityBodiesService],
})
export class AccountabilityBodiesModule {}
