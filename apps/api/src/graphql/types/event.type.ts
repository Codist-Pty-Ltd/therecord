import { Field, ID, ObjectType } from '@nestjs/graphql';

import { LegalReferenceType } from './legal-reference.type';

@ObjectType()
export class EventType {
  @Field(() => ID)
  id!: string;

  @Field()
  description!: string;

  @Field({ nullable: true })
  dateMentioned!: string | null;

  @Field({ nullable: true })
  title!: string | null;

  @Field({ nullable: true })
  eventType!: string | null;

  @Field(() => [LegalReferenceType], { nullable: true })
  legalReferences?: LegalReferenceType[];

  /** Used by DataLoaders for grouping — not exposed in the schema. */
  commissionId?: string;
}
