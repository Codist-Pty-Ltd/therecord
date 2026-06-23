import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ArticleType {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  headline!: string;

  @Field(() => String)
  sourceName!: string;

  @Field(() => String)
  sourceUrl!: string;

  @Field(() => String)
  publishedAt!: string;

  /** Used by DataLoaders for grouping — not exposed in the schema. */
  commissionId?: string;
}
