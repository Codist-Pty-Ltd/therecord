import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PersonType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  role!: string | null;

  /** Used by DataLoaders for grouping — not exposed in the schema. */
  commissionId?: string;
}
