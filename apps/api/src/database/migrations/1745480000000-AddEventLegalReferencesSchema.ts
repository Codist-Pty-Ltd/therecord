import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Aligns with `entities/event_legal_reference.entity.ts`.
 * Depends on `timeline_events`, `law_sections`, `constitution_sections`.
 */
export class AddEventLegalReferences1745480000000 implements MigrationInterface {
  name = 'AddEventLegalReferences1745480000000';

  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "event_legal_references" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "event_id" uuid NOT NULL,
        "law_section_id" uuid,
        "constitution_section_id" uuid,
        "relevance" text NOT NULL,
        "alleged_violation" boolean NOT NULL DEFAULT false,
        CONSTRAINT "event_legal_references_event_fk"
          FOREIGN KEY ("event_id") REFERENCES "timeline_events"("id") ON DELETE CASCADE,
        CONSTRAINT "event_legal_references_law_section_fk"
          FOREIGN KEY ("law_section_id") REFERENCES "law_sections"("id") ON DELETE SET NULL,
        CONSTRAINT "event_legal_references_constitution_section_fk"
          FOREIGN KEY ("constitution_section_id") REFERENCES "constitution_sections"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "event_legal_references_event_id_idx"
        ON "event_legal_references" ("event_id");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "event_legal_references_law_section_id_idx"
        ON "event_legal_references" ("law_section_id");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "event_legal_references_constitution_section_id_idx"
        ON "event_legal_references" ("constitution_section_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "event_legal_references";`);
  }
}
