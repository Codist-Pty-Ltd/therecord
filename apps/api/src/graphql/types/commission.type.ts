import { Field, ID, ObjectType } from '@nestjs/graphql';

import { ArticleType } from './article.type';
import { EventType } from './event.type';
import { PersonType } from './person.type';

@ObjectType()
export class CommissionType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  chairName!: string | null;

  @Field({ nullable: true })
  establishedYear!: string | null;

  @Field({ nullable: true })
  status!: string | null;

  @Field({ nullable: true })
  slug!: string | null;

  @Field(() => [PersonType], { nullable: true })
  people?: PersonType[];

  @Field(() => [EventType], { nullable: true })
  events?: EventType[];

  @Field(() => [ArticleType], { nullable: true })
  articles?: ArticleType[];
}
