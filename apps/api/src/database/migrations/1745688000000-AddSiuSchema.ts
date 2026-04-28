import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Introduce the Special Investigating Unit (SIU) as a permanent
 * accountability body alongside Commissions and Ad Hoc Committees.
 *
 * The SIU sits in its own architectural category: a *permanent statutory*
 * body that is *activated per investigation* by Presidential Proclamation.
 * That makes it structurally unlike either a commission of inquiry
 * (per-inquiry executive instrument) or an ad hoc committee (per-mandate
 * legislative instrument), so it gets its own family of tables:
 *
 *   1. `siu_body`                      — the institution itself (singleton)
 *   2. `siu_proclamations`             — the activation document (1 per investigation)
 *   3. `siu_investigation_outcomes`    — financial + referral results (1:1 with proclamation)
 *   4. `special_tribunal`              — the civil court (singleton)
 *   5. `special_tribunal_cases`        — civil litigation matters
 *   6. `siu_proclamation_people`       — implicated / referred / convicted persons
 *   7. `siu_proclamation_stories`      — story join table
 *   8. `stories.siu_proclamation_id`   — back-link FK on stories
 *
 * Singleton tables (`siu_body`, `special_tribunal`) are seeded with a
 * single row by `siu.seed.ts` at the end of this migration's seed pass;
 * the migration itself only creates the tables.
 *
 * All statements are idempotent — safe to re-run against a partially
 * applied database.
 */
export class AddSiuSchema1745688000000 implements MigrationInterface {
  name = 'AddSiuSchema1745688000000';

  /**
   * Match the pattern established by previous migrations: DDL for enums
   * and tables runs outside a transaction so partial application is
   * resumable. Every statement below is guarded with `IF NOT EXISTS` /
   * `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object`.
   */
  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ------------------------------------------------------------------ enums

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "proclamation_status" AS ENUM (
          'active',
          'concluded',
          'report_submitted',
          'litigation_ongoing'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "tribunal_case_status" AS ENUM (
          'pending',
          'hearing',
          'judgment_delivered',
          'settled',
          'withdrawn',
          'appeal_pending'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "siu_person_role" AS ENUM (
          'investigated',
          'implicated',
          'whistleblower',
          'referred_to_npa',
          'referred_disciplinary',
          'convicted',
          'acquitted'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    // -------------------------------------------------------------- siu_body

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "siu_body" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(200) NOT NULL DEFAULT 'Special Investigating Unit',
        "abbreviation" varchar(10) NOT NULL DEFAULT 'SIU',
        "enabling_legislation" varchar(200) NOT NULL
          DEFAULT 'Special Investigating Units and Special Tribunals Act 74 of 1996',
        "established_date" date NOT NULL DEFAULT '1997-07-14',
        "headquarters" varchar(200) NOT NULL
          DEFAULT 'Rentmeester Building, 74 Watermeyer Street, Meyerspark, Pretoria',
        "hotline" varchar(50) NOT NULL DEFAULT '0800 037 774',
        "current_head" varchar(300),
        "website_url" varchar(200) NOT NULL DEFAULT 'https://www.siu.org.za',
        "mandate_summary" text NOT NULL,
        "plain_english_summary" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    // ------------------------------------------------------- siu_proclamations

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "siu_proclamations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "proclamation_number" varchar(50) NOT NULL,
        "slug" varchar(200) NOT NULL,
        "title" varchar(500) NOT NULL,
        "full_title" varchar(2000),
        "gazette_number" varchar(100),
        "signed_date" date,
        "published_date" date,
        "domain" "commission_domain" NOT NULL,
        "investigation_scope" text NOT NULL,
        "plain_english_summary" text NOT NULL,
        "president_who_signed" varchar(200) NOT NULL,
        "period_covered_start" date,
        "period_covered_end" date,
        "status" "proclamation_status" NOT NULL DEFAULT 'active',
        "related_commission_id" uuid,
        "related_adhoc_committee_id" uuid,
        "official_url" varchar(2000),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "siu_proclamations_related_commission_fk"
          FOREIGN KEY ("related_commission_id")
          REFERENCES "commissions"("id") ON DELETE SET NULL,
        CONSTRAINT "siu_proclamations_related_adhoc_committee_fk"
          FOREIGN KEY ("related_adhoc_committee_id")
          REFERENCES "adhoc_committees"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "siu_proclamations_slug_uidx"
        ON "siu_proclamations" ("slug");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "siu_proclamations_status_idx"
        ON "siu_proclamations" ("status");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "siu_proclamations_domain_idx"
        ON "siu_proclamations" ("domain");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "siu_proclamations_signed_date_idx"
        ON "siu_proclamations" ("signed_date");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "siu_proclamations_related_commission_id_idx"
        ON "siu_proclamations" ("related_commission_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "siu_proclamations_related_adhoc_committee_id_idx"
        ON "siu_proclamations" ("related_adhoc_committee_id");
    `);

    // ----------------------------------------------- siu_investigation_outcomes

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "siu_investigation_outcomes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "proclamation_id" uuid NOT NULL,
        "total_value_investigated" bigint,
        "financial_losses_identified" bigint,
        "actual_recovered_rands" bigint,
        "losses_prevented_rands" bigint,
        "civil_litigation_value_rands" bigint,
        "contracts_set_aside_value" bigint,
        "referrals_to_npa" integer NOT NULL DEFAULT 0,
        "referrals_to_hawks" integer NOT NULL DEFAULT 0,
        "referrals_to_departments" integer NOT NULL DEFAULT 0,
        "employees_referred_disciplinary" integer NOT NULL DEFAULT 0,
        "employees_dismissed" integer NOT NULL DEFAULT 0,
        "special_tribunal_cases_filed" integer NOT NULL DEFAULT 0,
        "outcome_summary" text,
        "plain_english_outcome" text,
        "report_submitted_date" date,
        "report_url" varchar(2000),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "siu_investigation_outcomes_proclamation_fk"
          FOREIGN KEY ("proclamation_id")
          REFERENCES "siu_proclamations"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "siu_investigation_outcomes_proclamation_id_uidx"
        ON "siu_investigation_outcomes" ("proclamation_id");
    `);

    // ------------------------------------------------------ special_tribunal

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "special_tribunal" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(200) NOT NULL DEFAULT 'Special Tribunal',
        "established_date" date NOT NULL DEFAULT '2019-04-05',
        "enabling_legislation" varchar(300) NOT NULL
          DEFAULT 'Special Investigating Units and Special Tribunals Act 74 of 1996 Section 2',
        "plain_english_summary" text NOT NULL,
        "address" varchar(500),
        "website_url" varchar(200),
        "created_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    // ------------------------------------------------- special_tribunal_cases

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "special_tribunal_cases" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "proclamation_id" uuid NOT NULL,
        "case_number" varchar(100) NOT NULL,
        "case_title" varchar(1000) NOT NULL,
        "value_rands" bigint,
        "respondents" text[] NOT NULL DEFAULT '{}'::text[],
        "nature_of_claim" text NOT NULL,
        "filed_date" date,
        "status" "tribunal_case_status" NOT NULL DEFAULT 'pending',
        "outcome_summary" text,
        "amount_recovered_rands" bigint,
        "judgment_date" date,
        "judgment_url" varchar(2000),
        "plain_english_outcome" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "special_tribunal_cases_proclamation_fk"
          FOREIGN KEY ("proclamation_id")
          REFERENCES "siu_proclamations"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "special_tribunal_cases_case_number_uidx"
        ON "special_tribunal_cases" ("case_number");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "special_tribunal_cases_status_idx"
        ON "special_tribunal_cases" ("status");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "special_tribunal_cases_proclamation_id_idx"
        ON "special_tribunal_cases" ("proclamation_id");
    `);

    // ----------------------------------------------- siu_proclamation_people

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "siu_proclamation_people" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "proclamation_id" uuid NOT NULL,
        "person_id" uuid NOT NULL,
        "role" "siu_person_role" NOT NULL,
        "summary" text,
        CONSTRAINT "siu_proclamation_people_proclamation_fk"
          FOREIGN KEY ("proclamation_id")
          REFERENCES "siu_proclamations"("id") ON DELETE CASCADE,
        CONSTRAINT "siu_proclamation_people_person_fk"
          FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE,
        CONSTRAINT "siu_proclamation_people_uidx"
          UNIQUE ("proclamation_id", "person_id", "role")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "siu_proclamation_people_proclamation_id_idx"
        ON "siu_proclamation_people" ("proclamation_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "siu_proclamation_people_person_id_idx"
        ON "siu_proclamation_people" ("person_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "siu_proclamation_people_role_idx"
        ON "siu_proclamation_people" ("role");
    `);

    // ---------------------------------------------- siu_proclamation_stories

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "siu_proclamation_stories" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "proclamation_id" uuid NOT NULL,
        "story_id" uuid NOT NULL,
        CONSTRAINT "siu_proclamation_stories_proclamation_fk"
          FOREIGN KEY ("proclamation_id")
          REFERENCES "siu_proclamations"("id") ON DELETE CASCADE,
        CONSTRAINT "siu_proclamation_stories_story_fk"
          FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE,
        CONSTRAINT "siu_proclamation_stories_uidx"
          UNIQUE ("proclamation_id", "story_id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "siu_proclamation_stories_proclamation_id_idx"
        ON "siu_proclamation_stories" ("proclamation_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "siu_proclamation_stories_story_id_idx"
        ON "siu_proclamation_stories" ("story_id");
    `);

    // ---------------------------------- stories.siu_proclamation_id (nullable FK)

    await queryRunner.query(`
      ALTER TABLE "stories"
        ADD COLUMN IF NOT EXISTS "siu_proclamation_id" uuid;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "stories"
          ADD CONSTRAINT "stories_siu_proclamation_fk"
          FOREIGN KEY ("siu_proclamation_id")
          REFERENCES "siu_proclamations"("id") ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "stories_siu_proclamation_id_idx"
        ON "stories" ("siu_proclamation_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ----- stories.siu_proclamation_id
    await queryRunner.query(`
      DROP INDEX IF EXISTS "stories_siu_proclamation_id_idx";
    `);
    await queryRunner.query(`
      ALTER TABLE "stories" DROP CONSTRAINT IF EXISTS "stories_siu_proclamation_fk";
    `);
    await queryRunner.query(`
      ALTER TABLE "stories" DROP COLUMN IF EXISTS "siu_proclamation_id";
    `);

    // ----- siu_proclamation_stories
    await queryRunner.query(`DROP INDEX IF EXISTS "siu_proclamation_stories_story_id_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "siu_proclamation_stories_proclamation_id_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "siu_proclamation_stories";`);

    // ----- siu_proclamation_people
    await queryRunner.query(`DROP INDEX IF EXISTS "siu_proclamation_people_role_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "siu_proclamation_people_person_id_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "siu_proclamation_people_proclamation_id_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "siu_proclamation_people";`);

    // ----- special_tribunal_cases
    await queryRunner.query(`DROP INDEX IF EXISTS "special_tribunal_cases_proclamation_id_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "special_tribunal_cases_status_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "special_tribunal_cases_case_number_uidx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "special_tribunal_cases";`);

    // ----- special_tribunal
    await queryRunner.query(`DROP TABLE IF EXISTS "special_tribunal";`);

    // ----- siu_investigation_outcomes
    await queryRunner.query(`DROP INDEX IF EXISTS "siu_investigation_outcomes_proclamation_id_uidx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "siu_investigation_outcomes";`);

    // ----- siu_proclamations
    await queryRunner.query(`DROP INDEX IF EXISTS "siu_proclamations_related_adhoc_committee_id_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "siu_proclamations_related_commission_id_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "siu_proclamations_signed_date_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "siu_proclamations_domain_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "siu_proclamations_status_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "siu_proclamations_slug_uidx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "siu_proclamations";`);

    // ----- siu_body
    await queryRunner.query(`DROP TABLE IF EXISTS "siu_body";`);

    // ----- enum types (must come last — nothing may reference them)
    await queryRunner.query(`DROP TYPE IF EXISTS "siu_person_role";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "tribunal_case_status";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "proclamation_status";`);
  }
}
