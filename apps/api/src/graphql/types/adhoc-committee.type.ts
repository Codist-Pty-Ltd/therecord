import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AdhocCommitteeType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  status!: string | null;

  @Field({ nullable: true })
  parliamentTerm!: string | null;

  @Field({ nullable: true })
  slug!: string | null;
}
