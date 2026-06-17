import { MigrationInterface, QueryRunner } from 'typeorm';

/** Human review queue for unresolved entity mentions (M4 entity linking). */
export class AddEntityLinkCandidate1747800000000 implements MigrationInterface {
  name = 'AddEntityLinkCandidate1747800000000';

  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "entity_link_candidate" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "mention" text NOT NULL,
        "entity_type" text NOT NULL,
        "source_type" text,
        "source_id" uuid,
        "suggested_id" uuid,
        "suggested_name" text,
        "confidence" double precision NOT NULL,
        "status" text NOT NULL DEFAULT 'pending',
        "created_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "entity_link_candidate_status_idx"
      ON "entity_link_candidate" ("status");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "entity_link_candidate_source_idx"
      ON "entity_link_candidate" ("source_type", "source_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "entity_link_candidate_source_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "entity_link_candidate_status_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "entity_link_candidate";`);
  }
}
