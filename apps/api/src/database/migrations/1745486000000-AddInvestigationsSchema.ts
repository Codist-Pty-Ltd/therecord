import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Aligns with `entities/investigation.entity.ts`.
 */
export class AddInvestigations1745486000000 implements MigrationInterface {
  name = 'AddInvestigations1745486000000';

  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "investigation_type" AS ENUM (
          'judicial_commission',
          'parliamentary_committee',
          'saps_internal',
          'ipid',
          'npa',
          'other'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "investigation_status" AS ENUM (
          'active',
          'concluded',
          'pending_report',
          'stalled'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "investigations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "story_id" uuid NOT NULL,
        "name" varchar(500) NOT NULL,
        "investigation_type" "investigation_type" NOT NULL,
        "established_by" varchar(300) NOT NULL,
        "legal_basis" varchar(500) NOT NULL,
        "chair_name" varchar(300),
        "status" "investigation_status" NOT NULL DEFAULT 'active',
        "official_url" varchar(2000),
        "started_at" date,
        "concluded_at" date,
        CONSTRAINT "investigations_story_fk"
          FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "investigations_story_id_idx"
        ON "investigations" ("story_id");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "investigations_investigation_type_idx"
        ON "investigations" ("investigation_type");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "investigations_status_idx"
        ON "investigations" ("status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "investigations";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "investigation_status";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "investigation_type";`);
  }
}
