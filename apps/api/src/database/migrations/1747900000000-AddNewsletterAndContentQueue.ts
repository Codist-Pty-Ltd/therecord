import { MigrationInterface, QueryRunner } from 'typeorm';

/** Newsletter subscribers + editorial content monitoring queue. */
export class AddNewsletterAndContentQueue1747900000000 implements MigrationInterface {
  name = 'AddNewsletterAndContentQueue1747900000000';

  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "subscriber_status" AS ENUM ('pending', 'active', 'unsubscribed');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subscribers" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar(320) NOT NULL,
        "name" varchar(200),
        "status" "subscriber_status" NOT NULL DEFAULT 'pending',
        "confirm_token" uuid,
        "unsubscribe_token" uuid NOT NULL DEFAULT gen_random_uuid(),
        "confirmed_at" timestamptz,
        "unsubscribed_at" timestamptz,
        "source" varchar(50),
        "last_email_sent_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "subscribers_email_uidx" UNIQUE ("email")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "subscribers_status_idx"
      ON "subscribers" ("status");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "content_queue" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" text NOT NULL,
        "source" varchar(32) NOT NULL,
        "source_url" text,
        "relevance_score" double precision NOT NULL DEFAULT 0,
        "suggested_action" varchar(32) NOT NULL DEFAULT 'new_story',
        "related_entities" jsonb NOT NULL DEFAULT '{}',
        "summary" text,
        "status" varchar(32) NOT NULL DEFAULT 'pending',
        "reviewed_by" varchar(200),
        "reviewed_at" timestamptz,
        "story_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "content_queue_status_idx"
      ON "content_queue" ("status");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "content_queue_source_idx"
      ON "content_queue" ("source");
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "content_queue_source_url_uidx"
      ON "content_queue" ("source_url")
      WHERE "source_url" IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "content_queue_source_url_uidx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "content_queue_source_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "content_queue_status_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "content_queue";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "subscribers_status_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscribers";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "subscriber_status";`);
  }
}
