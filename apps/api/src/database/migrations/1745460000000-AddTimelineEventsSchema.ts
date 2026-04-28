import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Aligns with `entities/timeline_event.entity.ts`.
 * Depends on `stories` (1745450000000).
 */
export class AddTimelineEvents1745460000000 implements MigrationInterface {
  name = 'AddTimelineEvents1745460000000';

  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "timeline_event_type" AS ENUM (
          'incident',
          'press_conference',
          'arrest',
          'charge_filed',
          'commission_established',
          'hearing',
          'judgment',
          'suspension',
          'resignation',
          'statement',
          'acquittal',
          'other'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "timeline_event_significance" AS ENUM (
          'low',
          'medium',
          'high',
          'critical'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "timeline_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "story_id" uuid NOT NULL,
        "event_date" date NOT NULL,
        "event_type" "timeline_event_type" NOT NULL,
        "title" varchar(500) NOT NULL,
        "description" text NOT NULL,
        "plain_english" text NOT NULL,
        "significance" "timeline_event_significance" NOT NULL DEFAULT 'medium',
        "source_urls" text[] NOT NULL DEFAULT '{}',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "timeline_events_story_fk"
          FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "timeline_events_story_id_idx"
        ON "timeline_events" ("story_id");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "timeline_events_story_date_idx"
        ON "timeline_events" ("story_id", "event_date");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "timeline_events_event_type_idx"
        ON "timeline_events" ("event_type");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "timeline_events";`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "timeline_event_significance";`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "timeline_event_type";`);
  }
}
