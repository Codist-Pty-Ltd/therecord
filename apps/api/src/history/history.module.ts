import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HistoricalEra } from '../entities/historical-era.entity';
import { HistoricalEvent } from '../entities/historical-event.entity';
import { HistoricalLaw } from '../entities/historical-law.entity';
import { HistoricalStatistic } from '../entities/historical-statistic.entity';
import { Law } from '../entities/law.entity';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HistoricalEra,
      HistoricalEvent,
      HistoricalLaw,
      HistoricalStatistic,
      Law,
    ]),
  ],
  controllers: [HistoryController],
  providers: [HistoryService],
})
export class HistoryModule {}
