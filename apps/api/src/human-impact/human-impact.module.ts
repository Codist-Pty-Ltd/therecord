import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CommissionImpactSector } from '../entities/commission-impact-sector.entity';
import { ExpenditureImpactSector } from '../entities/expenditure-impact-sector.entity';
import { ImpactSector } from '../entities/impact-sector.entity';
import { StoryImpactSector } from '../entities/story-impact-sector.entity';

/**
 * Registers human-impact entities for TypeORM (`autoLoadEntities` picks these up app-wide).
 * HTTP surface (sectors API, story enrichments) can be added in a follow-up prompt.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ImpactSector,
      StoryImpactSector,
      ExpenditureImpactSector,
      CommissionImpactSector,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class HumanImpactModule {}
