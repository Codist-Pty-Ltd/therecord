import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdhocCommittee } from '../entities/adhoc_committee.entity';
import { Commission } from '../entities/commission.entity';
import { SiuBody } from '../entities/siu_body.entity';
import { SiuInvestigationOutcome } from '../entities/siu_investigation_outcome.entity';
import { SiuProclamation } from '../entities/siu_proclamation.entity';
import { SiuProclamationLawSection } from '../entities/siu_proclamation_law_section.entity';
import { SiuProclamationPerson } from '../entities/siu_proclamation_person.entity';
import { SiuProclamationStory } from '../entities/siu_proclamation_story.entity';
import { SpecialTribunal } from '../entities/special_tribunal.entity';
import { SpecialTribunalCase } from '../entities/special_tribunal_case.entity';
import { Story } from '../entities/story.entity';
import { SiuController } from './siu.controller';
import { SiuService } from './siu.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SiuBody,
      SiuProclamation,
      SiuProclamationLawSection,
      SiuInvestigationOutcome,
      SiuProclamationPerson,
      SiuProclamationStory,
      SpecialTribunal,
      SpecialTribunalCase,
      Commission,
      AdhocCommittee,
      Story,
    ]),
  ],
  controllers: [SiuController],
  providers: [SiuService],
  exports: [SiuService],
})
export class SiuModule {}
