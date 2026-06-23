import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdhocCommittee } from '../entities/adhoc_committee.entity';
import { Article } from '../entities/article.entity';
import { EventLegalReference } from '../entities/event_legal_reference.entity';
import { SiuProclamation } from '../entities/siu_proclamation.entity';
import { Story } from '../entities/story.entity';
import { TimelineEvent } from '../entities/timeline_event.entity';
import { CommissionsModule } from '../commissions/commissions.module';
import { PeopleModule } from '../people/people.module';
import { GraphqlDataService } from './graphql-data.service';
import { ArticlesByCommissionLoader } from './loaders/articles-by-commission.loader';
import { EventsByCommissionLoader } from './loaders/events-by-commission.loader';
import { LegalReferencesByEventLoader } from './loaders/legal-references-by-event.loader';
import { PeopleByCommissionLoader } from './loaders/people-by-commission.loader';
import {
  AdhocCommitteesResolver,
  EventsResolver,
  SiuResolver,
} from './resolvers/catalog.resolver';
import { CommissionsResolver } from './resolvers/commissions.resolver';
import { PeopleResolver } from './resolvers/people.resolver';

@Module({
  imports: [
    CommissionsModule,
    PeopleModule,
    TypeOrmModule.forFeature([
      TimelineEvent,
      Story,
      Article,
      EventLegalReference,
      SiuProclamation,
      AdhocCommittee,
    ]),
  ],
  providers: [
    GraphqlDataService,
    PeopleByCommissionLoader,
    EventsByCommissionLoader,
    ArticlesByCommissionLoader,
    LegalReferencesByEventLoader,
    CommissionsResolver,
    PeopleResolver,
    EventsResolver,
    SiuResolver,
    AdhocCommitteesResolver,
  ],
})
export class GraphqlModule {}
