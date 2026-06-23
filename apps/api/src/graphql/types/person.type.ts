import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PersonType {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  role!: string | null;

  /** Used by DataLoaders for grouping — not exposed in the schema. */
  commissionId?: string;
}
