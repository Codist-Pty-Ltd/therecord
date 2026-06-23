import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SiuProclamationType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  proclamationNumber!: string;

  @Field({ nullable: true })
  status!: string | null;

  @Field({ nullable: true })
  signedDate!: string | null;

  @Field({ nullable: true })
  slug!: string | null;
}
