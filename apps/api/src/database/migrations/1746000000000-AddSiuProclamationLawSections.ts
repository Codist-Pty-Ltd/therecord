import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Join table wiring SIU Presidential Proclamations to `law_sections` and/or
 * `constitution_sections` for the legal section "Applied in" cross-link strip.
 */
export class AddSiuProclamationLawSections1746000000000
  implements MigrationInterface
{
  name = 'AddSiuProclamationLawSections1746000000000';

  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS siu_proclamation_law_sections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        proclamation_id UUID NOT NULL REFERENCES siu_proclamations(id) ON DELETE CASCADE,
        law_section_id UUID REFERENCES law_sections(id) ON DELETE SET NULL,
        constitution_section_id UUID REFERENCES constitution_sections(id) ON DELETE SET NULL,
        usage_type VARCHAR(50) NOT NULL
          CHECK (usage_type IN ('enabling','investigated','violated','recovered_under')),
        relevance TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT check_at_least_one_section
          CHECK (law_section_id IS NOT NULL OR constitution_section_id IS NOT NULL)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_siu_proc_law_proclamation
        ON siu_proclamation_law_sections(proclamation_id);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_siu_proc_law_section
        ON siu_proclamation_law_sections(law_section_id);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_siu_proc_law_constitution
        ON siu_proclamation_law_sections(constitution_section_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS siu_proclamation_law_sections;`);
  }
}
