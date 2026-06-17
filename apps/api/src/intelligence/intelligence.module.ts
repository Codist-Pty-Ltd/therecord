import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Commission } from '../entities/commission.entity';
import { SiuProclamation } from '../entities/siu_proclamation.entity';
import { Story } from '../entities/story.entity';
import { TimelineEvent } from '../entities/timeline_event.entity';
import { IntelligenceCitationService } from './intelligence-citation.service';
import { IntelligenceController } from './intelligence.controller';
import { IntelligenceClient } from './intelligence.client';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Story,
      Commission,
      SiuProclamation,
      TimelineEvent,
    ]),
  ],
  controllers: [IntelligenceController],
  providers: [IntelligenceClient, IntelligenceCitationService],
  exports: [IntelligenceClient],
})
export class IntelligenceModule {}
