import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ArticleType {
  @Field(() => ID)
  id!: string;

  @Field()
  headline!: string;

  @Field()
  sourceName!: string;

  @Field()
  sourceUrl!: string;

  @Field()
  publishedAt!: string;

  /** Used by DataLoaders for grouping — not exposed in the schema. */
  commissionId?: string;
}
