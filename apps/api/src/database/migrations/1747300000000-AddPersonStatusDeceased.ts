import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPersonStatusDeceased1747300000000 implements MigrationInterface {
  name = 'AddPersonStatusDeceased1747300000000';

  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "person_status" ADD VALUE IF NOT EXISTS 'deceased';
    `);
  }

  public async down(): Promise<void> {
    // Enum label removal is unsafe in PostgreSQL; no-op.
  }
}
