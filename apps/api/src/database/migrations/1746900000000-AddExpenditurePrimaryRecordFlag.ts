import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Non-primary expenditure rows document the same underlying matter as other stories
 * (e.g. Arms Deal deal value on the Scorpions dossier while Zondo/Seriti carry the
 * commission narrative). The national money counter sums only primary rows.
 */
export class AddExpenditurePrimaryRecordFlag1746900000000 implements MigrationInterface {
  name = 'AddExpenditurePrimaryRecordFlag1746900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "public_expenditure_records"
      ADD COLUMN IF NOT EXISTS "is_primary_record" boolean NOT NULL DEFAULT true;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "public_expenditure_records_primary_idx"
        ON "public_expenditure_records" ("is_primary_record")
        WHERE "is_primary_record" = true;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public_expenditure_records_primary_idx";
    `);
    await queryRunner.query(`
      ALTER TABLE "public_expenditure_records"
      DROP COLUMN IF EXISTS "is_primary_record";
    `);
  }
}
