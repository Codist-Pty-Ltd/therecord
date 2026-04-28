import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Foundational legal + people schema — aligned with:
 * - `entities/law.entity.ts`
 * - `entities/law_section.entity.ts`
 * - `entities/constitution_section.entity.ts`
 * - `entities/person.entity.ts`
 *
 * Later migrations (commissions joins, SIU, etc.) depend on `laws`,
 * `law_sections`, `constitution_sections`, and `people`.
 */
export class AddLawsSchema1745400000000 implements MigrationInterface {
  name = 'AddLawsSchema1745400000000';

  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --------------------------------------------------------- law_category
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "law_category" AS ENUM (
          'corruption',
          'policing',
          'prosecution',
          'organised_crime',
          'whistleblower',
          'constitutional',
          'other'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    // ------------------------------------------------------------------ laws
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "laws" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(500) NOT NULL,
        "short_name" varchar(50) NOT NULL,
        "act_number" varchar(100) NOT NULL,
        "category" "law_category" NOT NULL,
        "plain_english" text NOT NULL,
        "full_text_url" varchar(1000)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "laws_short_name_idx"
        ON "laws" ("short_name");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "laws_category_idx"
        ON "laws" ("category");
    `);

    // ------------------------------------------------------------ law_sections
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "law_sections" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "law_id" uuid NOT NULL,
        "section_number" varchar(50) NOT NULL,
        "section_title" varchar(500) NOT NULL,
        "plain_english" text NOT NULL,
        "full_text" text,
        CONSTRAINT "law_sections_law_fk"
          FOREIGN KEY ("law_id")
          REFERENCES "laws"("id")
          ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "law_sections_law_id_idx"
        ON "law_sections" ("law_id");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "law_sections_section_number_idx"
        ON "law_sections" ("section_number");
    `);

    // ------------------------------------------------------ constitution_sections
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "constitution_sections" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "chapter_number" integer NOT NULL,
        "section_number" integer NOT NULL,
        "section_title" varchar(500) NOT NULL,
        "plain_english" text NOT NULL,
        "full_text" text,
        CONSTRAINT "constitution_sections_section_number_uidx" UNIQUE ("section_number")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "constitution_sections_chapter_idx"
        ON "constitution_sections" ("chapter_number");
    `);

    // -------------------------------------------------------- person_status
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "person_status" AS ENUM (
          'active',
          'suspended',
          'charged',
          'acquitted',
          'resigned',
          'unknown'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    // -------------------------------------------------------------------- people
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "people" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "full_name" varchar(300) NOT NULL,
        "aliases" text[] NOT NULL DEFAULT '{}',
        "current_role" varchar(300),
        "organisation" varchar(300),
        "status" "person_status" NOT NULL DEFAULT 'unknown',
        "profile_summary" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "people_full_name_idx"
        ON "people" ("full_name");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "people_status_idx"
        ON "people" ("status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "people";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "person_status";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "law_sections";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "laws";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "constitution_sections";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "law_category";`);
  }
}
