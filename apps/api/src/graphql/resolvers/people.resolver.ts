import { Args, ID, Query, Resolver } from '@nestjs/graphql';

import { PeopleService } from '../../people/people.service';
import { PersonType } from '../types/person.type';

@Resolver(() => PersonType)
export class PeopleResolver {
  constructor(private readonly peopleService: PeopleService) {}

  @Query(() => PersonType, { name: 'person', nullable: true })
  async findOne(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<PersonType | null> {
    try {
      const person = await this.peopleService.findOne(id);
      return {
        id: person.id,
        name: person.full_name,
        role: person.current_role,
      };
    } catch {
      return null;
    }
  }
}
