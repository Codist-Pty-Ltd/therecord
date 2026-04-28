import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Introduce commissions of inquiry as first-class entities.
 *
 * This migration:
 *   1. Creates the `commission_domain`, `commission_status`,
 *      `commission_law_section_usage`, and `commission_person_role` enums.
 *   2. Creates the `commissions` table with all fields + indices.
 *   3. Creates the `commission_law_sections` join table.
 *   4. Creates the `commission_people` join table.
 *   5. Adds `stories.commission_id` (nullable FK -> commissions.id).
 *
 * The migration is idempotent — everything uses `IF NOT EXISTS` / `IF EXISTS`
 * guards so it can run on a partially-seeded database.
 *
 * Down migration reverses steps 5 → 1 so that all enum types are dropped last
 * (Postgres refuses to drop an enum type that's still in use).
 */
export class AddCommissionsSchema1745515200000 implements MigrationInterface {
  name = 'AddCommissionsSchema1745515200000';

  /**
   * Postgres refuses to run `ALTER TYPE ... ADD VALUE` inside a transaction
   * block, so this migration opts out of TypeORM's default transaction wrap.
   * Every statement below is individually idempotent (`IF NOT EXISTS`,
   * `DO $$ ... EXCEPTION WHEN duplicate_object ...`), so a partial failure
   * is safely resumable by re-running the migration.
   */
  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ------------------------------------------------------------------ enums

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "commission_domain" AS ENUM (
          'criminal_justice',
          'politics',
          'organised_crime',
          'business',
          'labour',
          'human_rights',
          'financial',
          'education',
          'policing',
          'public_safety',
          'corruption'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    // Ensure the new enum values exist even when this migration runs against
    // a database that already has the old shape (e.g. dev boxes seeded via
    // schema:sync before these values were added).
    await queryRunner.query(`
      ALTER TYPE "commission_domain" ADD VALUE IF NOT EXISTS 'public_safety';
    `);
    await queryRunner.query(`
      ALTER TYPE "commission_domain" ADD VALUE IF NOT EXISTS 'corruption';
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "commission_status" AS ENUM (
          'active',
          'concluded',
          'pending_report',
          'stalled',
          'never_reported'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "commission_law_section_usage" AS ENUM (
          'enabling',
          'investigated',
          'violated',
          'recommended'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "commission_person_role" AS ENUM (
          'chair',
          'evidence_leader',
          'witness',
          'implicated',
          'legal_rep',
          'commissioner',
          'secretary',
          'subject_of_inquiry',
          'established_by'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      ALTER TYPE "commission_person_role" ADD VALUE IF NOT EXISTS 'subject_of_inquiry';
    `);
    await queryRunner.query(`
      ALTER TYPE "commission_person_role" ADD VALUE IF NOT EXISTS 'established_by';
    `);

    // ----------------------------------------------------------- commissions

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "commissions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "popular_name" varchar(100) NOT NULL,
        "full_name" varchar(1000) NOT NULL,
        "slug" varchar(200) NOT NULL,
        "domain" "commission_domain" NOT NULL,
        "enabling_legislation" varchar(500) NOT NULL,
        "constitution_section_invoked" varchar(100) NOT NULL,
        "reason_summary" text NOT NULL,
        "plain_english_summary" text NOT NULL,
        "chair_name" varchar(300) NOT NULL,
        "announced_date" date,
        "hearings_started" date,
        "concluded_date" date,
        "report_released_date" date,
        "status" "commission_status" NOT NULL DEFAULT 'active',
        "official_url" varchar(2000),
        "report_url" varchar(2000),
        "cost_rands" bigint,
        "total_hearing_days" integer,
        "outcome_summary" text,
        "produced_prosecutions" boolean,
        "president_who_established" varchar(200),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "commissions_slug_uidx"
        ON "commissions" ("slug");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "commissions_domain_idx"
        ON "commissions" ("domain");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "commissions_status_idx"
        ON "commissions" ("status");
    `);

    // --------------------------------------------------- commission_law_sections

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "commission_law_sections" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "commission_id" uuid NOT NULL,
        "law_section_id" uuid NOT NULL,
        "usage_type" "commission_law_section_usage" NOT NULL,
        CONSTRAINT "commission_law_sections_commission_fk"
          FOREIGN KEY ("commission_id") REFERENCES "commissions"("id") ON DELETE CASCADE,
        CONSTRAINT "commission_law_sections_law_section_fk"
          FOREIGN KEY ("law_section_id") REFERENCES "law_sections"("id") ON DELETE CASCADE,
        CONSTRAINT "commission_law_sections_uidx"
          UNIQUE ("commission_id", "law_section_id", "usage_type")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "commission_law_sections_commission_id_idx"
        ON "commission_law_sections" ("commission_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "commission_law_sections_law_section_id_idx"
        ON "commission_law_sections" ("law_section_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "commission_law_sections_usage_idx"
        ON "commission_law_sections" ("usage_type");
    `);

    // ------------------------------------------------------- commission_people

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "commission_people" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "commission_id" uuid NOT NULL,
        "person_id" uuid NOT NULL,
        "role" "commission_person_role" NOT NULL,
        "summary" text,
        CONSTRAINT "commission_people_commission_fk"
          FOREIGN KEY ("commission_id") REFERENCES "commissions"("id") ON DELETE CASCADE,
        CONSTRAINT "commission_people_person_fk"
          FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE,
        CONSTRAINT "commission_people_uidx"
          UNIQUE ("commission_id", "person_id", "role")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "commission_people_commission_id_idx"
        ON "commission_people" ("commission_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "commission_people_person_id_idx"
        ON "commission_people" ("person_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "commission_people_role_idx"
        ON "commission_people" ("role");
    `);

    // --------------------------------------- stories.commission_id (nullable FK)

    await queryRunner.query(`
      ALTER TABLE "stories"
        ADD COLUMN IF NOT EXISTS "commission_id" uuid;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "stories"
          ADD CONSTRAINT "stories_commission_fk"
          FOREIGN KEY ("commission_id") REFERENCES "commissions"("id") ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "stories_commission_id_idx"
        ON "stories" ("commission_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ----- stories.commission_id
    await queryRunner.query(`
      DROP INDEX IF EXISTS "stories_commission_id_idx";
    `);
    await queryRunner.query(`
      ALTER TABLE "stories" DROP CONSTRAINT IF EXISTS "stories_commission_fk";
    `);
    await queryRunner.query(`
      ALTER TABLE "stories" DROP COLUMN IF EXISTS "commission_id";
    `);

    // ----- commission_people
    await queryRunner.query(`DROP INDEX IF EXISTS "commission_people_role_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "commission_people_person_id_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "commission_people_commission_id_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "commission_people";`);

    // ----- commission_law_sections
    await queryRunner.query(`DROP INDEX IF EXISTS "commission_law_sections_usage_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "commission_law_sections_law_section_id_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "commission_law_sections_commission_id_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "commission_law_sections";`);

    // ----- commissions
    await queryRunner.query(`DROP INDEX IF EXISTS "commissions_status_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "commissions_domain_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "commissions_slug_uidx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "commissions";`);

    // ----- enum types (must come last — nothing may reference them)
    await queryRunner.query(`DROP TYPE IF EXISTS "commission_person_role";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "commission_law_section_usage";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "commission_status";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "commission_domain";`);
  }
}
