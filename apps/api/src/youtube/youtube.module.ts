import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngestionApiKeyGuard } from '../auth/ingestion-api-key.guard';
import { AdhocCommittee } from '../entities/adhoc_committee.entity';
import { Commission } from '../entities/commission.entity';
import { SiuProclamation } from '../entities/siu_proclamation.entity';
import { Story } from '../entities/story.entity';
import { YoutubeVideo } from '../entities/youtube-video.entity';
import { IntelligenceModule } from '../intelligence/intelligence.module';
import { YoutubeController } from './youtube.controller';
import { YoutubeService } from './youtube.service';

@Module({
  imports: [
    IntelligenceModule,
    TypeOrmModule.forFeature([
      YoutubeVideo,
      Commission,
      AdhocCommittee,
      Story,
      SiuProclamation,
    ]),
  ],
  controllers: [YoutubeController],
  providers: [YoutubeService, IngestionApiKeyGuard],
  exports: [YoutubeService],
})
export class YoutubeModule {}
