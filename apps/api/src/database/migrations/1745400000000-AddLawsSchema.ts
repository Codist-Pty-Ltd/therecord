import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Foundational legal + people schema that later migrations depend on
 * (e.g. commission_law_sections FK → law_sections).
 *
 * Creates:
 *   1. `laws`
 *   2. `law_sections` (FK → laws)
 *   3. `constitution_sections`
 *   4. `person_role` enum + `people`
 *
 * All statements are idempotent (`IF NOT EXISTS` / `duplicate_object` guards).
 *
 * Timestamp 1745400000000 ensures this runs before AddCommissionsSchema
 * (1745515200000) and subsequent migrations.
 */
export class AddLawsSchema1745400000000 implements MigrationInterface {
  name = 'AddLawsSchema1745400000000';

  /** Match other enum-heavy migrations — resumable DDL outside one transaction. */
  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ---------------------------------------------------------------- laws
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "laws" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "short_title" varchar(300) NOT NULL,
        "full_title" varchar(1000) NOT NULL,
        "slug" varchar(300) NOT NULL,
        "act_number" varchar(50),
        "year" integer,
        "ministry" varchar(300),
        "plain_english_summary" text,
        "url" varchar(2000),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "laws_slug_uidx"
        ON "laws" ("slug");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "laws_year_idx"
        ON "laws" ("year");
    `);

    // ------------------------------------------------------------ law_sections
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "law_sections" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "law_id" uuid NOT NULL,
        "section_number" varchar(50) NOT NULL,
        "heading" varchar(500) NOT NULL,
        "text" text NOT NULL,
        "plain_english" text,
        "slug" varchar(300) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "law_sections_law_fk"
          FOREIGN KEY ("law_id")
          REFERENCES "laws"("id")
          ON DELETE CASCADE,
        CONSTRAINT "law_sections_slug_uidx"
          UNIQUE ("slug")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "law_sections_law_id_idx"
        ON "law_sections" ("law_id");
    `);

    // ------------------------------------------------------ constitution_sections
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "constitution_sections" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "chapter" varchar(100) NOT NULL,
        "section_number" varchar(50) NOT NULL,
        "heading" varchar(500) NOT NULL,
        "text" text NOT NULL,
        "plain_english" text,
        "slug" varchar(300) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "constitution_sections_slug_uidx"
          UNIQUE ("slug")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS
        "constitution_sections_chapter_idx"
        ON "constitution_sections" ("chapter");
    `);

    // -------------------------------------------------------------------- people
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "person_role" AS ENUM (
          'politician',
          'judge',
          'prosecutor',
          'police',
          'businessman',
          'activist',
          'journalist',
          'academic',
          'civil_servant',
          'military',
          'other'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "people" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "full_name" varchar(300) NOT NULL,
        "slug" varchar(300) NOT NULL,
        "role" "person_role" NOT NULL DEFAULT 'other',
        "title" varchar(100),
        "profile_summary" text,
        "image_url" varchar(2000),
        "born_year" integer,
        "nationality" varchar(100) DEFAULT 'South African',
        "is_public_figure" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "people_slug_uidx" UNIQUE ("slug")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "people_role_idx"
        ON "people" ("role");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "people_name_idx"
        ON "people" ("full_name");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "people";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "constitution_sections";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "law_sections";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "laws";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "person_role";`);
  }
}
