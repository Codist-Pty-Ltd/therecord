import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * YouTube video resources linked to commissions / committees / stories / SIU.
 * Discovered by the intelligence service, reviewed by operators — never
 * auto-published.
 */
export class AddYoutubeVideos1746100000000 implements MigrationInterface {
  name = 'AddYoutubeVideos1746100000000';

  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "youtube_video_review_status" AS ENUM (
          'pending',
          'approved',
          'rejected'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "youtube_video_type" AS ENUM (
          'news_report',
          'parliamentary',
          'commission_hearing',
          'documentary',
          'analysis',
          'interview',
          'other'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "youtube_videos" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "youtube_id" varchar(20) NOT NULL,
        "title" varchar(500) NOT NULL,
        "channel_name" varchar(200),
        "channel_id" varchar(50),
        "description" text,
        "published_at" timestamptz,
        "duration_seconds" int,
        "thumbnail_url" varchar(500),
        "view_count" bigint,
        "relevance_score" decimal(4,2) NOT NULL DEFAULT '0',
        "relevance_reason" text,
        "status" "youtube_video_review_status" NOT NULL DEFAULT 'pending',
        "reviewed_by" varchar(100),
        "reviewed_at" timestamptz,
        "rejection_reason" varchar(500),
        "video_type" "youtube_video_type" NOT NULL DEFAULT 'other',
        "language" varchar(10) NOT NULL DEFAULT 'en',
        "commission_id" uuid,
        "adhoc_committee_id" uuid,
        "story_id" uuid,
        "siu_proclamation_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "youtube_videos_youtube_id_uidx" UNIQUE ("youtube_id"),
        CONSTRAINT "FK_youtube_videos_commission"
          FOREIGN KEY ("commission_id") REFERENCES "commissions"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_youtube_videos_adhoc"
          FOREIGN KEY ("adhoc_committee_id") REFERENCES "adhoc_committees"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_youtube_videos_story"
          FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_youtube_videos_siu_proclamation"
          FOREIGN KEY ("siu_proclamation_id") REFERENCES "siu_proclamations"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "youtube_videos_status_idx"
      ON "youtube_videos" ("status");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "youtube_videos_commission_id_idx"
      ON "youtube_videos" ("commission_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "youtube_videos_story_id_idx"
      ON "youtube_videos" ("story_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "youtube_videos";`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "youtube_video_type" CASCADE;`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "youtube_video_review_status" CASCADE;`,
    );
  }
}
