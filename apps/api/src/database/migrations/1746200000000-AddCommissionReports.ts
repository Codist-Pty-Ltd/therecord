import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Official reports / PDFs linked to commissions, ad hoc committees, or
 * SIU proclamations. At least one parent FK must be set (check constraint).
 */
export class AddCommissionReports1746200000000 implements MigrationInterface {
  name = 'AddCommissionReports1746200000000';

  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "commission_report_type" AS ENUM (
          'final_report',
          'interim_report',
          'supplementary_report',
          'terms_of_reference',
          'executive_summary',
          'recommendations_only',
          'minority_report'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "commission_reports" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "commission_id" uuid,
        "adhoc_committee_id" uuid,
        "siu_proclamation_id" uuid,
        "volume_number" int,
        "volume_title" varchar(500),
        "report_type" "commission_report_type" NOT NULL,
        "title" varchar(500) NOT NULL,
        "published_date" date,
        "page_count" int,
        "file_size_mb" decimal(6,2),
        "source_url" varchar(2000) NOT NULL,
        "mirror_url" varchar(2000),
        "is_verified" boolean NOT NULL DEFAULT false,
        "language" varchar(10) NOT NULL DEFAULT 'en',
        "summary" text,
        "key_findings" text[],
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "commission_reports_at_least_one_parent_chk" CHECK (
          (CASE WHEN "commission_id" IS NOT NULL THEN 1 ELSE 0 END)
          + (CASE WHEN "adhoc_committee_id" IS NOT NULL THEN 1 ELSE 0 END)
          + (CASE WHEN "siu_proclamation_id" IS NOT NULL THEN 1 ELSE 0 END)
          >= 1
        ),
        CONSTRAINT "FK_commission_reports_commission"
          FOREIGN KEY ("commission_id") REFERENCES "commissions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_commission_reports_adhoc"
          FOREIGN KEY ("adhoc_committee_id") REFERENCES "adhoc_committees"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_commission_reports_siu_proclamation"
          FOREIGN KEY ("siu_proclamation_id") REFERENCES "siu_proclamations"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "commission_reports_commission_id_idx"
      ON "commission_reports" ("commission_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "commission_reports_adhoc_committee_id_idx"
      ON "commission_reports" ("adhoc_committee_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "commission_reports_siu_proclamation_id_idx"
      ON "commission_reports" ("siu_proclamation_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "commission_reports_report_type_idx"
      ON "commission_reports" ("report_type");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "commission_reports";`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "commission_report_type" CASCADE;`,
    );
  }
}
