import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Provinces, municipalities, public expenditure records, similar-story links,
 * and story-level geographic / category / money aggregates.
 */
export class AddProvincialAccountability1746500000000 implements MigrationInterface {
  name = 'AddProvincialAccountability1746500000000';

  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "municipality_type" AS ENUM ('metropolitan', 'local', 'district');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "ag_audit_outcome" AS ENUM (
          'clean',
          'unqualified_with_findings',
          'qualified',
          'adverse',
          'disclaimer',
          'outstanding'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "amount_qualifier" AS ENUM (
          'exact',
          'approximate',
          'minimum',
          'maximum',
          'under_investigation'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "expenditure_type" AS ENUM (
          'stolen',
          'allegedly_stolen',
          'fruitless_wasteful',
          'irregular',
          'under_investigation',
          'recovered',
          'prevented'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "expenditure_sector" AS ENUM (
          'housing',
          'construction_roads',
          'water_sanitation',
          'health',
          'education',
          'social_grants',
          'police_security',
          'energy',
          'transport',
          'other_procurement',
          'state_owned_enterprise',
          'other'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "story_category" AS ENUM (
          'tender_fraud',
          'housing_corruption',
          'construction_mafia',
          'water_sanitation',
          'health_corruption',
          'education_corruption',
          'social_grants_fraud',
          'police_misconduct',
          'energy_corruption',
          'state_capture',
          'whistleblower',
          'gang_linked_corruption',
          'other'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "similarity_reason" AS ENUM (
          'same_province',
          'same_municipality',
          'same_sector',
          'same_accused',
          'same_category',
          'same_pattern'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "provinces" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(100) NOT NULL UNIQUE,
        "slug" varchar(100) NOT NULL UNIQUE,
        "abbreviation" varchar(10),
        "capital" varchar(100),
        "premier_name" varchar(200),
        "corruption_watch_complaint_percentage" decimal(5,2),
        "auditor_general_irregular_expenditure_rands" bigint,
        "ag_report_year" varchar(10),
        "created_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      INSERT INTO "provinces" (
        "name", "slug", "abbreviation", "capital", "premier_name",
        "corruption_watch_complaint_percentage",
        "auditor_general_irregular_expenditure_rands", "ag_report_year"
      )
      VALUES
        ('Gauteng', 'gauteng', 'GP', 'Johannesburg', NULL,
          37.00, 6900000000, '2023/24'),
        ('KwaZulu-Natal', 'kwazulu-natal', 'KZN', 'Pietermaritzburg', NULL,
          19.00, 3450000000, '2023/24'),
        ('Western Cape', 'western-cape', 'WC', 'Cape Town', NULL, 9.00, NULL, NULL),
        ('Eastern Cape', 'eastern-cape', 'EC', 'Bhisho', NULL, NULL, NULL, NULL),
        ('Free State', 'free-state', 'FS', 'Bloemfontein', NULL, 10.00, NULL, NULL),
        ('Limpopo', 'limpopo', 'LP', 'Polokwane', NULL, NULL, NULL, NULL),
        ('Mpumalanga', 'mpumalanga', 'MP', 'Nelspruit', NULL, NULL, NULL, NULL),
        ('Northern Cape', 'northern-cape', 'NC', 'Kimberley', NULL, NULL, NULL, NULL),
        ('North West', 'north-west', 'NW', 'Mahikeng', NULL, NULL, NULL, NULL)
      ON CONFLICT ("slug") DO NOTHING;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "municipalities" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(200) NOT NULL,
        "short_name" varchar(100) NOT NULL,
        "slug" varchar(200) NOT NULL UNIQUE,
        "municipality_type" "municipality_type" NOT NULL,
        "province_id" uuid NOT NULL
          REFERENCES "provinces"("id") ON DELETE CASCADE,
        "mayor_name" varchar(200),
        "governing_party" varchar(100),
        "annual_budget_rands" bigint,
        "ag_audit_outcome" "ag_audit_outcome",
        "ag_audit_year" varchar(10),
        "ag_irregular_expenditure_rands" bigint,
        "plain_english_audit_outcome" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "municipalities_province_fk"
        ON "municipalities" ("province_id");
    `);

    await queryRunner.query(`
      INSERT INTO "municipalities" (
        "name", "short_name", "slug", "municipality_type", "province_id",
        "governing_party", "annual_budget_rands",
        "ag_audit_outcome", "plain_english_audit_outcome", "ag_irregular_expenditure_rands"
      )
      SELECT
        v.name, v.short_name, v.slug, v.mtype::municipality_type, p.id,
        v.party, v.budget, v.outcome::"ag_audit_outcome", v.plain_en, v.irregular
      FROM (VALUES
        (
          'City of Cape Town Metropolitan Municipality',
          'Cape Town',
          'city-of-cape-town',
          'metropolitan',
          'western-cape',
          'DA',
          75000000000::bigint,
          'clean',
          'The City received a clean audit — meaning financial records are in order — but critics note that clean audits do not detect all procurement irregularities or corruption.',
          NULL::bigint
        ),
        (
          'eThekwini Metropolitan Municipality',
          'Durban',
          'ethekwini',
          'metropolitan',
          'kwazulu-natal',
          'ANC',
          NULL,
          'qualified',
          NULL,
          NULL
        ),
        (
          'City of Johannesburg Metropolitan Municipality',
          'Johannesburg',
          'city-of-johannesburg',
          'metropolitan',
          'gauteng',
          'Coalition',
          NULL,
          'qualified',
          NULL,
          NULL
        ),
        (
          'City of Tshwane Metropolitan Municipality',
          'Tshwane',
          'city-of-tshwane',
          'metropolitan',
          'gauteng',
          'DA',
          NULL,
          NULL,
          NULL,
          NULL
        ),
        (
          'Ekurhuleni Metropolitan Municipality',
          'Ekurhuleni',
          'ekurhuleni',
          'metropolitan',
          'gauteng',
          'ANC',
          NULL,
          NULL,
          NULL,
          NULL
        ),
        (
          'OR Tambo District Municipality',
          'OR Tambo',
          'or-tambo-district',
          'district',
          'eastern-cape',
          'ANC',
          NULL,
          'disclaimer',
          NULL,
          NULL
        ),
        (
          'Matjhabeng Local Municipality',
          'Matjhabeng',
          'matjhabeng',
          'local',
          'free-state',
          'ANC',
          NULL,
          NULL,
          NULL,
          500000000::bigint
        )
      ) AS v(name, short_name, slug, mtype, province_slug, party, budget, outcome, plain_en, irregular)
      INNER JOIN "provinces" p ON p.slug = v.province_slug
      ON CONFLICT ("slug") DO NOTHING;
    `);

    await queryRunner.query(`
      ALTER TABLE "stories" ADD COLUMN IF NOT EXISTS "province_id" uuid;
    `);
    await queryRunner.query(`
      ALTER TABLE "stories" ADD COLUMN IF NOT EXISTS "municipality_id" uuid;
    `);
    await queryRunner.query(`
      ALTER TABLE "stories" ADD COLUMN IF NOT EXISTS "story_category" "story_category";
    `);
    await queryRunner.query(`
      ALTER TABLE "stories" ADD COLUMN IF NOT EXISTS "total_amount_rands" bigint;
    `);

    await queryRunner.query(`
      ALTER TABLE "stories" DROP CONSTRAINT IF EXISTS "stories_province_fk";
    `);
    await queryRunner.query(`
      ALTER TABLE "stories" ADD CONSTRAINT "stories_province_fk"
        FOREIGN KEY ("province_id") REFERENCES "provinces"("id") ON DELETE SET NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE "stories" DROP CONSTRAINT IF EXISTS "stories_municipality_fk";
    `);
    await queryRunner.query(`
      ALTER TABLE "stories" ADD CONSTRAINT "stories_municipality_fk"
        FOREIGN KEY ("municipality_id") REFERENCES "municipalities"("id") ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "stories_province_id_idx" ON "stories" ("province_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "stories_municipality_id_idx" ON "stories" ("municipality_id");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public_expenditure_records" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "story_id" uuid NOT NULL
          REFERENCES "stories"("id") ON DELETE CASCADE,
        "province_id" uuid REFERENCES "provinces"("id") ON DELETE SET NULL,
        "municipality_id" uuid REFERENCES "municipalities"("id") ON DELETE SET NULL,
        "amount_rands" bigint NOT NULL,
        "amount_qualifier" "amount_qualifier" NOT NULL DEFAULT 'approximate',
        "expenditure_type" "expenditure_type" NOT NULL,
        "sector" "expenditure_sector" NOT NULL,
        "description" text NOT NULL,
        "plain_english" text,
        "source_document" varchar(500),
        "source_url" varchar(2000),
        "reference_date" date,
        "is_verified" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "public_expenditure_records_story_id_idx"
        ON "public_expenditure_records" ("story_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "public_expenditure_records_province_id_idx"
        ON "public_expenditure_records" ("province_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "public_expenditure_records_municipality_id_idx"
        ON "public_expenditure_records" ("municipality_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "public_expenditure_records_expenditure_type_idx"
        ON "public_expenditure_records" ("expenditure_type");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "public_expenditure_records_sector_idx"
        ON "public_expenditure_records" ("sector");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "public_expenditure_records_amount_rands_idx"
        ON "public_expenditure_records" ("amount_rands");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "similar_stories" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "story_id" uuid NOT NULL REFERENCES "stories"("id") ON DELETE CASCADE,
        "similar_story_id" uuid NOT NULL REFERENCES "stories"("id") ON DELETE CASCADE,
        "similarity_reason" "similarity_reason" NOT NULL,
        "similarity_note" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "similar_stories_story_similar_uidx" UNIQUE ("story_id", "similar_story_id")
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "similar_stories_story_id_idx"
        ON "similar_stories" ("story_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "similar_stories_similar_story_id_idx"
        ON "similar_stories" ("similar_story_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "similar_stories";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "public_expenditure_records";`);

    await queryRunner.query(`
      ALTER TABLE "stories" DROP CONSTRAINT IF EXISTS "stories_municipality_fk";
    `);
    await queryRunner.query(`
      ALTER TABLE "stories" DROP CONSTRAINT IF EXISTS "stories_province_fk";
    `);
    await queryRunner.query(`
      ALTER TABLE "stories" DROP COLUMN IF EXISTS "total_amount_rands";
    `);
    await queryRunner.query(`
      ALTER TABLE "stories" DROP COLUMN IF EXISTS "story_category";
    `);
    await queryRunner.query(`
      ALTER TABLE "stories" DROP COLUMN IF EXISTS "municipality_id";
    `);
    await queryRunner.query(`
      ALTER TABLE "stories" DROP COLUMN IF EXISTS "province_id";
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS "municipalities";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "provinces";`);

    await queryRunner.query(`DROP TYPE IF EXISTS "similarity_reason";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "story_category";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "expenditure_sector";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "expenditure_type";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "amount_qualifier";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "ag_audit_outcome";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "municipality_type";`);
  }
}
