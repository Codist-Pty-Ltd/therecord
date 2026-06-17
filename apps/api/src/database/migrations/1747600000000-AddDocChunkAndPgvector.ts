import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Intelligence layer — pgvector corpus chunks for RAG indexing.
 * Embedding dim 384 is tied to BAAI/bge-small-en-v1.5; changing the model
 * requires altering the column type, rebuilding the index, and re-indexing.
 */
export class AddDocChunkAndPgvector1747600000000 implements MigrationInterface {
  name = 'AddDocChunkAndPgvector1747600000000';

  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector;`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "doc_chunk" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "source_type" text NOT NULL,
        "source_id" uuid NOT NULL,
        "chunk_index" int NOT NULL,
        "content" text NOT NULL,
        "embedding" vector(384),
        "content_hash" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "doc_chunk_source_chunk_uidx"
          UNIQUE ("source_type", "source_id", "chunk_index")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "doc_chunk_embedding_idx"
      ON "doc_chunk" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "doc_chunk_source_idx"
      ON "doc_chunk" ("source_type", "source_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "doc_chunk_source_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "doc_chunk_embedding_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "doc_chunk";`);
  }
}
