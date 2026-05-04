import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Extends `story_domain` with `corruption` so standalone corruption threads
 * (provincial health procurement, police tenders, etc.) match commission taxonomy.
 */
export class AddStoryDomainCorruption1747200000000 implements MigrationInterface {
  name = 'AddStoryDomainCorruption1747200000000';

  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "story_domain" ADD VALUE IF NOT EXISTS 'corruption';
    `);
  }

  public async down(): Promise<void> {
    // PostgreSQL cannot remove a single enum label safely; no-op down.
  }
}
