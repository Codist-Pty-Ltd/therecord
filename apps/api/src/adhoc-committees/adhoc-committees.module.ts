import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdhocCommittee } from '../entities/adhoc_committee.entity';
import { AdhocCommitteeLawSection } from '../entities/adhoc_committee_law_section.entity';
import { AdhocCommitteePerson } from '../entities/adhoc_committee_person.entity';
import { Commission } from '../entities/commission.entity';
import { Story } from '../entities/story.entity';
import { TimelineEvent } from '../entities/timeline_event.entity';
import { AdhocCommitteesController } from './adhoc-committees.controller';
import { AdhocCommitteesService } from './adhoc-committees.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdhocCommittee,
      AdhocCommitteeLawSection,
      AdhocCommitteePerson,
      Commission,
      Story,
      TimelineEvent,
    ]),
  ],
  controllers: [AdhocCommitteesController],
  providers: [AdhocCommitteesService],
  exports: [AdhocCommitteesService],
})
export class AdhocCommitteesModule {}
