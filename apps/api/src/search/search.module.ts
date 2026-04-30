import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdhocCommittee } from '../entities/adhoc_committee.entity';
import { AccountabilityBody } from '../entities/accountability-body.entity';
import { Commission } from '../entities/commission.entity';
import { Law } from '../entities/law.entity';
import { LawSection } from '../entities/law_section.entity';
import { Municipality } from '../entities/municipality.entity';
import { Person } from '../entities/person.entity';
import { Province } from '../entities/province.entity';
import { SiuProclamation } from '../entities/siu_proclamation.entity';
import { Story } from '../entities/story.entity';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Story,
      Person,
      Commission,
      AdhocCommittee,
      SiuProclamation,
      Law,
      LawSection,
      Province,
      Municipality,
      AccountabilityBody,
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
