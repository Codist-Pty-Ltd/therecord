import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class LegalReferenceType {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  relevance!: string;

  @Field(() => Boolean)
  allegedViolation!: boolean;

  @Field(() => String, { nullable: true })
  lawSectionLabel!: string | null;

  @Field(() => String, { nullable: true })
  constitutionSectionNumber!: string | null;

  /** Used by DataLoaders for grouping — not exposed in the schema. */
  eventId?: string;
}
