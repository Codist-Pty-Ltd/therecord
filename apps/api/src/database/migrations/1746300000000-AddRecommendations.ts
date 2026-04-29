import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Commission / ad hoc committee recommendations with implementation tracking.
 */
export class AddRecommendations1746300000000 implements MigrationInterface {
  name = 'AddRecommendations1746300000000';

  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "recommendation_category" AS ENUM (
          'prosecution',
          'legislation',
          'policy',
          'institutional',
          'disciplinary',
          'further_investigation',
          'compensation',
          'appointment',
          'other'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "recommendation_implementation_status" AS ENUM (
          'implemented',
          'partially_implemented',
          'not_implemented',
          'in_progress',
          'rejected',
          'unknown'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "recommendations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "commission_id" uuid,
        "adhoc_committee_id" uuid,
        "reference_number" varchar(50),
        "title" varchar(500) NOT NULL,
        "full_text" text,
        "plain_english" text,
        "plain_english_child" text,
        "category" "recommendation_category" NOT NULL,
        "directed_at" varchar(300),
        "persons_named" text[],
        "implementation_status" "recommendation_implementation_status" NOT NULL DEFAULT 'unknown',
        "implementation_notes" text,
        "implementation_date" date,
        "implementation_source_url" varchar(2000),
        "volume_reference" varchar(100),
        "is_verified" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "recommendations_at_least_one_parent_chk" CHECK (
          (CASE WHEN "commission_id" IS NOT NULL THEN 1 ELSE 0 END)
          + (CASE WHEN "adhoc_committee_id" IS NOT NULL THEN 1 ELSE 0 END)
          >= 1
        ),
        CONSTRAINT "FK_recommendations_commission"
          FOREIGN KEY ("commission_id") REFERENCES "commissions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_recommendations_adhoc"
          FOREIGN KEY ("adhoc_committee_id") REFERENCES "adhoc_committees"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "recommendations_commission_id_idx"
      ON "recommendations" ("commission_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "recommendations_adhoc_committee_id_idx"
      ON "recommendations" ("adhoc_committee_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "recommendations_implementation_status_idx"
      ON "recommendations" ("implementation_status");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "recommendations_category_idx"
      ON "recommendations" ("category");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "recommendations";`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "recommendation_implementation_status" CASCADE;`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "recommendation_category" CASCADE;`,
    );
  }
}
