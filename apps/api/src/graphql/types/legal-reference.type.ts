import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class LegalReferenceType {
  @Field(() => ID)
  id!: string;

  @Field()
  relevance!: string;

  @Field()
  allegedViolation!: boolean;

  @Field({ nullable: true })
  lawSectionLabel!: string | null;

  @Field({ nullable: true })
  constitutionSectionNumber!: string | null;

  /** Used by DataLoaders for grouping — not exposed in the schema. */
  eventId?: string;
}
