import {
  Args,
  ID,
  Int,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';

import { CommissionsService } from '../../commissions/commissions.service';
import { mapCommission } from '../mappers';
import { ArticlesByCommissionLoader } from '../loaders/articles-by-commission.loader';
import { EventsByCommissionLoader } from '../loaders/events-by-commission.loader';
import { PeopleByCommissionLoader } from '../loaders/people-by-commission.loader';
import { ArticleType } from '../types/article.type';
import { CommissionType } from '../types/commission.type';
import { EventType } from '../types/event.type';
import { PersonType } from '../types/person.type';

@Resolver(() => CommissionType)
export class CommissionsResolver {
  constructor(
    private readonly commissionsService: CommissionsService,
    private readonly peopleLoader: PeopleByCommissionLoader,
    private readonly eventsLoader: EventsByCommissionLoader,
    private readonly articlesLoader: ArticlesByCommissionLoader,
  ) {}

  @Query(() => [CommissionType], { name: 'commissions' })
  async findAll(
    @Args('status', { nullable: true }) status?: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 })
    limit?: number,
  ): Promise<CommissionType[]> {
    const rows = await this.commissionsService.findAllForGraphql({
      status,
      limit,
    });
    return rows.map(mapCommission);
  }

  @Query(() => CommissionType, { name: 'commission', nullable: true })
  async findOne(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<CommissionType | null> {
    const row = await this.commissionsService.findById(id);
    return row ? mapCommission(row) : null;
  }

  @ResolveField(() => [PersonType])
  async people(@Parent() commission: CommissionType): Promise<PersonType[]> {
    return this.peopleLoader.load(commission.id);
  }

  @ResolveField(() => [EventType])
  async events(@Parent() commission: CommissionType): Promise<EventType[]> {
    return this.eventsLoader.load(commission.id);
  }

  @ResolveField(() => [ArticleType])
  async articles(@Parent() commission: CommissionType): Promise<ArticleType[]> {
    return this.articlesLoader.load(commission.id);
  }
}
