import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdhocCommittee } from '../entities/adhoc_committee.entity';
import { AdhocCommitteeLawSection } from '../entities/adhoc_committee_law_section.entity';
import { Commission } from '../entities/commission.entity';
import { CommissionLawSection } from '../entities/commission_law_section.entity';
import { ConstitutionSection } from '../entities/constitution_section.entity';
import { EventLegalReference } from '../entities/event_legal_reference.entity';
import { LawSection } from '../entities/law_section.entity';
import { Law } from '../entities/law.entity';
import { SiuProclamationLawSection } from '../entities/siu_proclamation_law_section.entity';
import { Story } from '../entities/story.entity';
import { TimelineEvent } from '../entities/timeline_event.entity';
import { LegalController } from './legal.controller';
import { LegalService } from './legal.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Law,
      LawSection,
      ConstitutionSection,
      // The section detail endpoint joins through these to assemble the
      // "applied in" cross-link strip. None of them are persisted *by* this
      // module — they're read-only here.
      Commission,
      CommissionLawSection,
      AdhocCommittee,
      AdhocCommitteeLawSection,
      Story,
      TimelineEvent,
      EventLegalReference,
      SiuProclamationLawSection,
    ]),
  ],
  controllers: [LegalController],
  providers: [LegalService],
  exports: [LegalService],
})
export class LegalModule {}
