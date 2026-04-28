import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Commission } from '../entities/commission.entity';
import { CommissionLawSection } from '../entities/commission_law_section.entity';
import { CommissionPerson } from '../entities/commission_person.entity';
import { Story } from '../entities/story.entity';
import { TimelineEvent } from '../entities/timeline_event.entity';
import { CommissionsController } from './commissions.controller';
import { CommissionsService } from './commissions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Commission,
      CommissionLawSection,
      CommissionPerson,
      Story,
      TimelineEvent,
    ]),
  ],
  controllers: [CommissionsController],
  providers: [CommissionsService],
  exports: [CommissionsService],
})
export class CommissionsModule {}
