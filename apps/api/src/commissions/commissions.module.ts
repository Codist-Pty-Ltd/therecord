import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionReport } from '../entities/commission-report.entity';
import { Commission } from '../entities/commission.entity';
import { CommissionLawSection } from '../entities/commission_law_section.entity';
import { CommissionPerson } from '../entities/commission_person.entity';
import { Story } from '../entities/story.entity';
import { TimelineEvent } from '../entities/timeline_event.entity';
import { CommissionsController } from './commissions.controller';
import { CommissionsService } from './commissions.service';
import { RecommendationsModule } from '../recommendations/recommendations.module';

@Module({
  imports: [
    RecommendationsModule,
    TypeOrmModule.forFeature([
      Commission,
      CommissionReport,
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
