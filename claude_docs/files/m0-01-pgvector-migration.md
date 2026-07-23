# M0-01 · pgvector extension + `doc_chunk` migration (TypeORM)

**Produces:** a TypeORM migration in `apps/api` creating the `vector` extension
and the `doc_chunk` table. **Depends on:** nothing. **Verify:**
`node dist/database/run-migrations.js` runs clean and `\d doc_chunk` shows the
vector column.

```
In apps/api, add a new TypeORM migration following the EXACT pattern of the
existing migrations in apps/api/src/database/migrations (same naming, same
class shape, same import style). Name it AddDocChunkAndPgvector.

In up(), use queryRunner.query() with raw SQL (TypeORM has no native vector
type):

  CREATE EXTENSION IF NOT EXISTS vector;

  CREATE TABLE IF NOT EXISTS doc_chunk (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type   TEXT NOT NULL,            -- 'story'|'commission'|'person'|'timeline_event'|'siu'
    source_id     UUID NOT NULL,            -- UUID of the originating row (polymorphic, no FK)
    chunk_index   INT  NOT NULL,
    content       TEXT NOT NULL,
    embedding     vector(384),              -- BAAI/bge-small-en-v1.5
    content_hash  TEXT NOT NULL,            -- for idempotent re-indexing
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (source_type, source_id, chunk_index)
  );

  CREATE INDEX IF NOT EXISTS doc_chunk_embedding_idx
    ON doc_chunk USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
  CREATE INDEX IF NOT EXISTS doc_chunk_source_idx
    ON doc_chunk (source_type, source_id);

In down(), DROP the indexes and the table (leave the extension in place).

Add a one-line code comment: embedding dim 384 is tied to bge-small; changing
the model requires changing the column type, the index, and re-indexing.
Confirm gen_random_uuid() is available (pgcrypto) on Postgres 16 — if the repo's
other migrations enable an extension for UUIDs, match that approach instead.
```
