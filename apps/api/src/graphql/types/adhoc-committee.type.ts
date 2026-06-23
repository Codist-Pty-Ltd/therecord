import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AdhocCommitteeType {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  status!: string | null;

  @Field(() => String, { nullable: true })
  parliamentTerm!: string | null;

  @Field(() => String, { nullable: true })
  slug!: string | null;
}
