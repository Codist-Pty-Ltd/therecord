import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Aligns with `entities/article.entity.ts`.
 */
export class AddArticles1745484000000 implements MigrationInterface {
  name = 'AddArticles1745484000000';

  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "articles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "story_id" uuid NOT NULL,
        "source_name" varchar(200) NOT NULL,
        "source_url" varchar(2000) NOT NULL,
        "headline" varchar(1000) NOT NULL,
        "published_at" timestamptz NOT NULL,
        "content_snippet" varchar(500) NOT NULL,
        "ai_processed" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "articles_story_fk"
          FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "articles_story_id_idx"
        ON "articles" ("story_id");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "articles_published_at_idx"
        ON "articles" ("published_at");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "articles_ai_processed_idx"
        ON "articles" ("ai_processed");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "articles";`);
  }
}
