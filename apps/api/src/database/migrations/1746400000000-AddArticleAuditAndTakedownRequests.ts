import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Article ingest audit fields + takedown request log for compliance.
 */
export class AddArticleAuditAndTakedownRequests1746400000000
  implements MigrationInterface
{
  name = 'AddArticleAuditAndTakedownRequests1746400000000';

  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "fetched_at" timestamptz;
    `);
    await queryRunner.query(`
      UPDATE "articles" SET "fetched_at" = "created_at" WHERE "fetched_at" IS NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE "articles" ALTER COLUMN "fetched_at" SET DEFAULT now();
    `);
    await queryRunner.query(`
      ALTER TABLE "articles" ALTER COLUMN "fetched_at" SET NOT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "snippet_char_count" integer NOT NULL DEFAULT 0;
    `);
    await queryRunner.query(`
      UPDATE "articles" SET "snippet_char_count" = char_length("content_snippet");
    `);

    await queryRunner.query(`
      ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "full_text_stored" boolean NOT NULL DEFAULT false;
    `);

    await queryRunner.query(`
      ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "source_rss_feed" varchar(500);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "takedown_requests" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "request_type" varchar(40) NOT NULL,
        "requestor_name" varchar(300) NOT NULL,
        "requestor_email" varchar(300) NOT NULL,
        "content_url" varchar(2000) NOT NULL,
        "description" text NOT NULL,
        "status" varchar(32) NOT NULL DEFAULT 'received',
        "resolution_notes" text,
        "received_at" timestamptz NOT NULL DEFAULT now(),
        "resolved_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "takedown_requests_received_at_idx"
        ON "takedown_requests" ("received_at" DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "takedown_requests";`);
    await queryRunner.query(`
      ALTER TABLE "articles" DROP COLUMN IF EXISTS "source_rss_feed";
    `);
    await queryRunner.query(`
      ALTER TABLE "articles" DROP COLUMN IF EXISTS "full_text_stored";
    `);
    await queryRunner.query(`
      ALTER TABLE "articles" DROP COLUMN IF EXISTS "snippet_char_count";
    `);
    await queryRunner.query(`
      ALTER TABLE "articles" DROP COLUMN IF EXISTS "fetched_at";
    `);
  }
}
