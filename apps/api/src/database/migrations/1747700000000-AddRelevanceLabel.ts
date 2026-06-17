import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 2 training store for YouTube / transcript relevance labels.
 * Populated by the intelligence YouTube discover flow (centroid_v1 scores).
 */
export class AddRelevanceLabel1747700000000 implements MigrationInterface {
  name = 'AddRelevanceLabel1747700000000';

  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "relevance_label" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "video_id" text NOT NULL,
        "title" text,
        "channel" text,
        "text" text NOT NULL,
        "score" double precision NOT NULL,
        "method" text NOT NULL,
        "heuristic_score" double precision,
        "human_label" boolean,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "relevance_label_video_uidx" UNIQUE ("video_id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "relevance_label_human_label_idx"
      ON "relevance_label" ("human_label");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "relevance_label_human_label_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "relevance_label";`);
  }
}
