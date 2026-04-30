import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Accountability bodies (Scorpions, Hawks, IDAC, AFU, etc.), their notable cases,
 * and optional links from stories / commissions.
 */
export class AddAccountabilityBodies1746600000000 implements MigrationInterface {
  name = 'AddAccountabilityBodies1746600000000';

  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "accountability_body_type" AS ENUM (
          'investigative_unit',
          'prosecutorial_unit',
          'asset_recovery_unit',
          'oversight_body',
          'hybrid'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "accountability_body_status" AS ENUM (
          'active',
          'disbanded',
          'restructured',
          'absorbed'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "accountability_body_case_outcome" AS ENUM (
          'convicted',
          'acquitted',
          'charges_withdrawn',
          'transferred_to_hawks',
          'transferred_to_npa',
          'still_pending',
          'died_before_verdict',
          'fled_jurisdiction',
          'never_charged',
          'plea_deal'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "accountability_body_case_significance" AS ENUM (
          'landmark',
          'high',
          'medium',
          'low'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "accountability_bodies" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(200) NOT NULL,
        "popular_name" varchar(100) NOT NULL UNIQUE,
        "abbreviation" varchar(20) NOT NULL UNIQUE,
        "slug" varchar(200) NOT NULL UNIQUE,
        "body_type" "accountability_body_type" NOT NULL,
        "parent_organisation" varchar(200),
        "enabling_legislation" varchar(300),
        "constitution_section" varchar(100),
        "status" "accountability_body_status" NOT NULL,
        "established_date" date NOT NULL,
        "announced_date" date,
        "operational_date" date,
        "disbanded_date" date,
        "replaced_by" varchar(200),
        "disbanded_reason" text,
        "mandate_summary" text NOT NULL,
        "plain_english_summary" text NOT NULL,
        "plain_english_child" text NOT NULL,
        "tactics" text,
        "distinguishing_features" text,
        "leadership_history" jsonb,
        "total_investigations" int,
        "total_prosecutions" int,
        "total_convictions" int,
        "conviction_rate_percentage" decimal(5,2),
        "total_arrests" int,
        "assets_seized_rands" bigint,
        "financial_losses_recovered_rands" bigint,
        "cases_transferred_on_dissolution" int,
        "staff_count_at_peak" int,
        "annual_budget_rands" bigint,
        "legacy_summary" text,
        "cases_outcome_after_transfer" text,
        "was_political_disbanding" boolean,
        "political_disbanding_evidence" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "accountability_body_cases" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "body_id" uuid NOT NULL
          REFERENCES "accountability_bodies"("id") ON DELETE CASCADE,
        "story_id" uuid REFERENCES "stories"("id") ON DELETE SET NULL,
        "case_name" varchar(300) NOT NULL,
        "accused_names" text[] NOT NULL DEFAULT '{}'::text[],
        "charge_summary" varchar(500),
        "case_year_start" int NOT NULL,
        "case_year_end" int,
        "outcome" "accountability_body_case_outcome" NOT NULL,
        "outcome_detail" text,
        "significance" "accountability_body_case_significance" NOT NULL DEFAULT 'medium',
        "value_rands" bigint,
        "plain_english" text,
        "law_sections_applied" text[] NOT NULL DEFAULT '{}'::text[],
        "created_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "accountability_body_cases_body_id_idx"
        ON "accountability_body_cases" ("body_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "accountability_body_cases_story_id_idx"
        ON "accountability_body_cases" ("story_id");
    `);

    await queryRunner.query(`
      ALTER TABLE "stories" ADD COLUMN IF NOT EXISTS "accountability_body_id" uuid;
    `);
    await queryRunner.query(`
      ALTER TABLE "stories" DROP CONSTRAINT IF EXISTS "stories_accountability_body_fk";
    `);
    await queryRunner.query(`
      ALTER TABLE "stories" ADD CONSTRAINT "stories_accountability_body_fk"
        FOREIGN KEY ("accountability_body_id") REFERENCES "accountability_bodies"("id") ON DELETE SET NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "stories_accountability_body_id_idx"
        ON "stories" ("accountability_body_id");
    `);

    await queryRunner.query(`
      ALTER TABLE "commissions" ADD COLUMN IF NOT EXISTS "subject_body_id" uuid;
    `);
    await queryRunner.query(`
      ALTER TABLE "commissions" DROP CONSTRAINT IF EXISTS "commissions_subject_body_fk";
    `);
    await queryRunner.query(`
      ALTER TABLE "commissions" ADD CONSTRAINT "commissions_subject_body_fk"
        FOREIGN KEY ("subject_body_id") REFERENCES "accountability_bodies"("id") ON DELETE SET NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "commissions_subject_body_id_idx"
        ON "commissions" ("subject_body_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "commissions" DROP CONSTRAINT IF EXISTS "commissions_subject_body_fk";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "commissions_subject_body_id_idx";
    `);
    await queryRunner.query(`
      ALTER TABLE "commissions" DROP COLUMN IF EXISTS "subject_body_id";
    `);

    await queryRunner.query(`
      ALTER TABLE "stories" DROP CONSTRAINT IF EXISTS "stories_accountability_body_fk";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "stories_accountability_body_id_idx";
    `);
    await queryRunner.query(`
      ALTER TABLE "stories" DROP COLUMN IF EXISTS "accountability_body_id";
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS "accountability_body_cases";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "accountability_bodies";`);

    await queryRunner.query(`DROP TYPE IF EXISTS "accountability_body_case_significance";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "accountability_body_case_outcome";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "accountability_body_status";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "accountability_body_type";`);
  }
}
