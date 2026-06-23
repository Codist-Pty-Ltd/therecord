import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Commission } from '../entities/commission.entity';
import { SiuProclamation } from '../entities/siu_proclamation.entity';
import { Story } from '../entities/story.entity';
import { TimelineEvent } from '../entities/timeline_event.entity';
import { IntelligenceCitationService } from './intelligence-citation.service';
import { IntelligenceController } from './intelligence.controller';
import { IntelligenceClient } from './intelligence.client';
import { LegalMapperService } from './legal-mapper.service';
import { StoryClusterService } from './story-cluster.service';
import { YoutubeScorerService } from './youtube-scorer.service';

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
  providers: [
    IntelligenceClient,
    IntelligenceCitationService,
    LegalMapperService,
    YoutubeScorerService,
    StoryClusterService,
  ],
  exports: [
    IntelligenceClient,
    LegalMapperService,
    YoutubeScorerService,
    StoryClusterService,
  ],
})
export class IntelligenceModule {}
