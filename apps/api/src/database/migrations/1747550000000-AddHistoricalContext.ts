import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * South African history layer: eras, events, repealed/colonial laws, statistics.
 */
export class AddHistoricalContext1747550000000 implements MigrationInterface {
  name = 'AddHistoricalContext1747550000000';

  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "historical_event_type" AS ENUM (
          'founding', 'law_enacted', 'law_repealed', 'dispossession', 'resistance',
          'massacre', 'negotiation', 'election', 'economic', 'social', 'liberation', 'assassination'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "historical_event_significance" AS ENUM (
          'foundational', 'critical', 'high', 'medium'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "historical_law_category" AS ENUM (
          'land', 'labour', 'education', 'movement', 'political', 'classification',
          'housing', 'amenities', 'security', 'economy'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "historical_law_status" AS ENUM (
          'active', 'repealed', 'replaced'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "historical_stat_type" AS ENUM (
          'income_gap', 'wealth_gap', 'land_ownership', 'unemployment', 'poverty',
          'education', 'life_expectancy', 'population', 'other'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "historical_eras" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "slug" varchar(100) NOT NULL UNIQUE,
        "name" varchar(200) NOT NULL,
        "period" varchar(100) NOT NULL,
        "order_index" int NOT NULL,
        "summary" text NOT NULL,
        "plain_english_child" text NOT NULL,
        "plain_english_layperson" text NOT NULL,
        "plain_english_legal" text NOT NULL,
        "key_theme" varchar(300),
        "icon" varchar(10),
        "created_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "historical_eras_order_idx"
      ON "historical_eras" ("order_index");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "historical_laws" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "era_id" uuid NOT NULL REFERENCES "historical_eras"("id") ON DELETE CASCADE,
        "year_enacted" int NOT NULL,
        "year_repealed" int,
        "name" varchar(300) NOT NULL,
        "full_name" varchar(500),
        "act_number" varchar(100),
        "slug" varchar(300) NOT NULL UNIQUE,
        "category" historical_law_category NOT NULL,
        "status" historical_law_status NOT NULL DEFAULT 'repealed',
        "replaced_by" varchar(300),
        "what_it_did" text NOT NULL,
        "plain_english_child" text NOT NULL,
        "plain_english_layperson" text NOT NULL,
        "impact_summary" text NOT NULL,
        "constitutional_violation" text,
        "is_foundational" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "historical_laws_era_year_idx"
      ON "historical_laws" ("era_id", "year_enacted");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "historical_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "era_id" uuid NOT NULL REFERENCES "historical_eras"("id") ON DELETE CASCADE,
        "year" int NOT NULL,
        "year_display" varchar(50),
        "event_type" historical_event_type NOT NULL,
        "title" varchar(500) NOT NULL,
        "description" text NOT NULL,
        "plain_english_child" text NOT NULL,
        "significance" historical_event_significance NOT NULL DEFAULT 'high',
        "is_verified" boolean NOT NULL DEFAULT true,
        "source_attribution" varchar(500),
        "related_law_id" uuid REFERENCES "laws"("id") ON DELETE SET NULL,
        "related_historical_law_id" uuid REFERENCES "historical_laws"("id") ON DELETE SET NULL,
        "related_commission_id" uuid REFERENCES "commissions"("id") ON DELETE SET NULL,
        "related_person_id" uuid REFERENCES "people"("id") ON DELETE SET NULL,
        "related_story_id" uuid REFERENCES "stories"("id") ON DELETE SET NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "historical_events_era_year_idx"
      ON "historical_events" ("era_id", "year");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "historical_events_type_idx"
      ON "historical_events" ("event_type");
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "historical_events_era_year_title_uniq"
      ON "historical_events" ("era_id", "year", "title");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "historical_statistics" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "era_id" uuid NOT NULL REFERENCES "historical_eras"("id") ON DELETE CASCADE,
        "stat_type" historical_stat_type NOT NULL,
        "label" varchar(200) NOT NULL,
        "value" varchar(100) NOT NULL,
        "value_context" text NOT NULL,
        "year_or_period" varchar(50),
        "source" varchar(300) NOT NULL,
        "plain_english_child" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "historical_statistics_era_idx"
      ON "historical_statistics" ("era_id");
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "historical_statistics_era_label_uniq"
      ON "historical_statistics" ("era_id", "label");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "historical_statistics_era_label_uniq";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "historical_events_era_year_title_uniq";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "historical_statistics";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "historical_events";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "historical_laws";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "historical_eras";`);

    await queryRunner.query(`DROP TYPE IF EXISTS "historical_stat_type";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "historical_law_status";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "historical_law_category";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "historical_event_significance";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "historical_event_type";`);
  }
}
