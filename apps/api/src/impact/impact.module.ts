import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CommissionImpactSector } from '../entities/commission-impact-sector.entity';
import { ImpactSector } from '../entities/impact-sector.entity';
import { PublicExpenditureRecord } from '../entities/public-expenditure-record.entity';
import { Story } from '../entities/story.entity';
import { StoryImpactSector } from '../entities/story-impact-sector.entity';
import { ImpactController } from './impact.controller';
import { ImpactService } from './impact.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ImpactSector,
      StoryImpactSector,
      Story,
      PublicExpenditureRecord,
      CommissionImpactSector,
    ]),
  ],
  controllers: [ImpactController],
  providers: [ImpactService],
})
export class ImpactModule {}
