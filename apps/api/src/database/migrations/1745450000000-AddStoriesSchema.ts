import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Core `stories` table — must exist before {@link AddCommissionsSchema1745515200000},
 * which ALTERs `stories` to add `commission_id`.
 *
 * Historically the table may have been brought in only via `synchronize: true` in
 * dev; production and CI rely on migrations only, so nothing created `stories`
 * until this migration.
 *
 * Columns match `apps/api/src/entities/story.entity.ts` **excluding** FK columns
 * added later: `commission_id`, `adhoc_committee_id`, `siu_proclamation_id`.
 */
export class AddStoriesSchema1745450000000 implements MigrationInterface {
  name = 'AddStoriesSchema1745450000000';

  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "story_domain" AS ENUM (
          'criminal_justice',
          'politics',
          'organised_crime',
          'business',
          'labour'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "story_status" AS ENUM (
          'active',
          'resolved',
          'dormant'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "stories" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" varchar(500) NOT NULL,
        "slug" varchar(500) NOT NULL,
        "domain" "story_domain" NOT NULL,
        "status" "story_status" NOT NULL DEFAULT 'active',
        "summary" text,
        "plain_english_summary" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "stories_slug_uidx" UNIQUE ("slug")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "stories_domain_idx"
        ON "stories" ("domain");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "stories_status_idx"
        ON "stories" ("status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "stories_status_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "stories_domain_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "stories";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "story_status";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "story_domain";`);
  }
}
