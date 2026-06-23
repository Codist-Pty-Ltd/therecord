import { Args, ID, Int, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { GraphqlDataService } from '../graphql-data.service';
import { LegalReferencesByEventLoader } from '../loaders/legal-references-by-event.loader';
import { mapSiuProclamation, mapAdhocCommittee } from '../mappers';
import { AdhocCommitteeType } from '../types/adhoc-committee.type';
import { EventType } from '../types/event.type';
import { LegalReferenceType } from '../types/legal-reference.type';
import { SiuProclamationType } from '../types/siu-proclamation.type';

@Resolver(() => EventType)
export class EventsResolver {
  constructor(
    private readonly legalRefsLoader: LegalReferencesByEventLoader,
  ) {}

  @ResolveField(() => [LegalReferenceType])
  async legalReferences(
    @Parent() event: EventType,
  ): Promise<LegalReferenceType[]> {
    return this.legalRefsLoader.load(event.id);
  }
}

@Resolver(() => SiuProclamationType)
export class SiuResolver {
  constructor(private readonly graphqlData: GraphqlDataService) {}

  @Query(() => [SiuProclamationType], { name: 'siuProclamations' })
  async findAll(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 })
    limit?: number,
  ): Promise<SiuProclamationType[]> {
    const rows = await this.graphqlData.findSiuProclamations(limit);
    return rows.map(mapSiuProclamation);
  }

  @Query(() => SiuProclamationType, {
    name: 'siuProclamation',
    nullable: true,
  })
  async findOne(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<SiuProclamationType | null> {
    const row = await this.graphqlData.findSiuProclamationById(id);
    return row ? mapSiuProclamation(row) : null;
  }
}

@Resolver(() => AdhocCommitteeType)
export class AdhocCommitteesResolver {
  constructor(private readonly graphqlData: GraphqlDataService) {}

  @Query(() => [AdhocCommitteeType], { name: 'adhocCommittees' })
  async findAll(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 })
    limit?: number,
  ): Promise<AdhocCommitteeType[]> {
    const rows = await this.graphqlData.findAdhocCommittees(limit);
    return rows.map(mapAdhocCommittee);
  }

  @Query(() => AdhocCommitteeType, {
    name: 'adhocCommittee',
    nullable: true,
  })
  async findOne(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<AdhocCommitteeType | null> {
    const row = await this.graphqlData.findAdhocCommitteeById(id);
    return row ? mapAdhocCommittee(row) : null;
  }
}
