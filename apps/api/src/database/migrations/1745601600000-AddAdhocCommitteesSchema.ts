import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Introduce Parliamentary Ad Hoc Committees as first-class entities.
 *
 * Ad hoc committees sit in the legislature under s55(2) + NA Rule 253 and
 * are structurally distinct from executive commissions of inquiry, so they
 * get their own tables. A committee can cross-link to a commission via
 * `adhoc_committees.related_commission_id` (the Mkhwanazi case).
 *
 * This migration:
 *   1. Creates four new enums:
 *        - adhoc_committee_category
 *        - adhoc_committee_status
 *        - adhoc_committee_person_role
 *        - adhoc_committee_law_section_usage
 *      (reuses the existing `commission_domain` enum for the domain column.)
 *   2. Creates `adhoc_committees` + indices, including the nullable FK
 *      `related_commission_id -> commissions(id) ON DELETE SET NULL`.
 *   3. Creates `adhoc_committee_people` join table.
 *   4. Creates `adhoc_committee_law_sections` join table.
 *   5. Adds `stories.adhoc_committee_id` (nullable FK -> adhoc_committees.id).
 *
 * All statements are idempotent — this migration is safe to re-run against
 * a partially-applied database.
 */
export class AddAdhocCommitteesSchema1745601600000 implements MigrationInterface {
  name = 'AddAdhocCommitteesSchema1745601600000';

  /**
   * Match the pattern established by 1745515200000-AddCommissionsSchema.ts:
   * DDL for enums + tables is run outside a transaction so that partial
   * application is safely resumable (every statement below is guarded).
   */
  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ------------------------------------------------------------------ enums

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "adhoc_committee_category" AS ENUM (
          'accountability',
          'constitutional_amendment',
          'legislation',
          'appointments',
          'disaster_response',
          'oversight',
          'other'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "adhoc_committee_status" AS ENUM (
          'active',
          'concluded',
          'lapsed',
          'mandate_completed'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "adhoc_committee_person_role" AS ENUM (
          'chair',
          'member',
          'witness',
          'implicated',
          'legal_rep',
          'secretary'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "adhoc_committee_law_section_usage" AS ENUM (
          'enabling',
          'investigated',
          'amended',
          'being_processed'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    // ------------------------------------------------------ adhoc_committees

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "adhoc_committees" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "popular_name" varchar(200) NOT NULL,
        "full_name" varchar(1000) NOT NULL,
        "slug" varchar(300) NOT NULL,
        "parliament_term" varchar(50),
        "parliament_years" varchar(20),
        "domain" "commission_domain" NOT NULL,
        "category" "adhoc_committee_category" NOT NULL,
        "established_by" varchar(200) NOT NULL DEFAULT 'National Assembly',
        "enabling_provision" varchar(500),
        "is_joint_committee" boolean NOT NULL DEFAULT false,
        "chair_name" varchar(300),
        "mandate_summary" text NOT NULL,
        "plain_english_summary" text NOT NULL,
        "announced_date" date,
        "first_meeting_date" date,
        "concluded_date" date,
        "report_adopted_date" date,
        "status" "adhoc_committee_status" NOT NULL DEFAULT 'active',
        "outcome_summary" text,
        "produced_legislative_change" boolean,
        "produced_accountability_action" boolean,
        "report_url" varchar(2000),
        "parliament_url" varchar(2000),
        "related_commission_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "adhoc_committees_related_commission_fk"
          FOREIGN KEY ("related_commission_id")
          REFERENCES "commissions"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "adhoc_committees_slug_uidx"
        ON "adhoc_committees" ("slug");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "adhoc_committees_domain_idx"
        ON "adhoc_committees" ("domain");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "adhoc_committees_status_idx"
        ON "adhoc_committees" ("status");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "adhoc_committees_parliament_term_idx"
        ON "adhoc_committees" ("parliament_term");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "adhoc_committees_related_commission_id_idx"
        ON "adhoc_committees" ("related_commission_id");
    `);

    // -------------------------------------------------- adhoc_committee_people

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "adhoc_committee_people" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "adhoc_committee_id" uuid NOT NULL,
        "person_id" uuid NOT NULL,
        "role" "adhoc_committee_person_role" NOT NULL,
        "party_affiliation" varchar(100),
        "summary" text,
        CONSTRAINT "adhoc_committee_people_committee_fk"
          FOREIGN KEY ("adhoc_committee_id")
          REFERENCES "adhoc_committees"("id") ON DELETE CASCADE,
        CONSTRAINT "adhoc_committee_people_person_fk"
          FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE,
        CONSTRAINT "adhoc_committee_people_uidx"
          UNIQUE ("adhoc_committee_id", "person_id", "role")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "adhoc_committee_people_committee_id_idx"
        ON "adhoc_committee_people" ("adhoc_committee_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "adhoc_committee_people_person_id_idx"
        ON "adhoc_committee_people" ("person_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "adhoc_committee_people_role_idx"
        ON "adhoc_committee_people" ("role");
    `);

    // --------------------------------------------- adhoc_committee_law_sections

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "adhoc_committee_law_sections" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "adhoc_committee_id" uuid NOT NULL,
        "law_section_id" uuid NOT NULL,
        "usage_type" "adhoc_committee_law_section_usage" NOT NULL,
        CONSTRAINT "adhoc_committee_law_sections_committee_fk"
          FOREIGN KEY ("adhoc_committee_id")
          REFERENCES "adhoc_committees"("id") ON DELETE CASCADE,
        CONSTRAINT "adhoc_committee_law_sections_law_section_fk"
          FOREIGN KEY ("law_section_id")
          REFERENCES "law_sections"("id") ON DELETE CASCADE,
        CONSTRAINT "adhoc_committee_law_sections_uidx"
          UNIQUE ("adhoc_committee_id", "law_section_id", "usage_type")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "adhoc_committee_law_sections_committee_id_idx"
        ON "adhoc_committee_law_sections" ("adhoc_committee_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "adhoc_committee_law_sections_law_section_id_idx"
        ON "adhoc_committee_law_sections" ("law_section_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "adhoc_committee_law_sections_usage_idx"
        ON "adhoc_committee_law_sections" ("usage_type");
    `);

    // ---------------------------------- stories.adhoc_committee_id (nullable FK)

    await queryRunner.query(`
      ALTER TABLE "stories"
        ADD COLUMN IF NOT EXISTS "adhoc_committee_id" uuid;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "stories"
          ADD CONSTRAINT "stories_adhoc_committee_fk"
          FOREIGN KEY ("adhoc_committee_id")
          REFERENCES "adhoc_committees"("id") ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "stories_adhoc_committee_id_idx"
        ON "stories" ("adhoc_committee_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ----- stories.adhoc_committee_id
    await queryRunner.query(`
      DROP INDEX IF EXISTS "stories_adhoc_committee_id_idx";
    `);
    await queryRunner.query(`
      ALTER TABLE "stories" DROP CONSTRAINT IF EXISTS "stories_adhoc_committee_fk";
    `);
    await queryRunner.query(`
      ALTER TABLE "stories" DROP COLUMN IF EXISTS "adhoc_committee_id";
    `);

    // ----- adhoc_committee_law_sections
    await queryRunner.query(`DROP INDEX IF EXISTS "adhoc_committee_law_sections_usage_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "adhoc_committee_law_sections_law_section_id_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "adhoc_committee_law_sections_committee_id_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "adhoc_committee_law_sections";`);

    // ----- adhoc_committee_people
    await queryRunner.query(`DROP INDEX IF EXISTS "adhoc_committee_people_role_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "adhoc_committee_people_person_id_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "adhoc_committee_people_committee_id_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "adhoc_committee_people";`);

    // ----- adhoc_committees
    await queryRunner.query(`DROP INDEX IF EXISTS "adhoc_committees_related_commission_id_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "adhoc_committees_parliament_term_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "adhoc_committees_status_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "adhoc_committees_domain_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "adhoc_committees_slug_uidx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "adhoc_committees";`);

    // ----- enum types (must come last — nothing may reference them)
    await queryRunner.query(`DROP TYPE IF EXISTS "adhoc_committee_law_section_usage";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "adhoc_committee_person_role";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "adhoc_committee_status";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "adhoc_committee_category";`);
  }
}
