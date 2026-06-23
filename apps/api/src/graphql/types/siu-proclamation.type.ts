import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SiuProclamationType {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String)
  proclamationNumber!: string;

  @Field(() => String, { nullable: true })
  status!: string | null;

  @Field(() => String, { nullable: true })
  signedDate!: string | null;

  @Field(() => String, { nullable: true })
  slug!: string | null;
}
