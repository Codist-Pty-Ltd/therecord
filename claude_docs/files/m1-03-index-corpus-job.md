# M1-03 · `index_corpus` job

**Produces:** `apps/intelligence/jobs/index_corpus.py` (CLI). **Depends on:**
M0, M1-01, M1-02. **Verify:** running it populates `doc_chunk`; re-running is a
no-op for unchanged rows.

```
Create apps/intelligence/jobs/index_corpus.py: a CLI batch job that reads The
Record's corpus from Postgres, chunks + embeds it, and upserts into doc_chunk.

IMPORTANT: read the ACTUAL table and column names from the repo schema
(apps/api entities / migrations) for Story, TimelineEvent, Commission, Person,
and the SIU entities. Map each to (source_type, source_id UUID, text). Use the
human-readable narrative/description/title/body fields as the indexable text;
skip rows with empty text.

Behaviour:
- For each source row: build its text, chunk via core.chunking, compute
  content_hash per chunk, embed via core.embeddings.embed_texts (batched).
- Idempotent upsert keyed on (source_type, source_id, chunk_index): if a row
  with the same content_hash already exists, skip (no re-embed); if content
  changed, re-embed and update; delete stale chunks for a source whose chunk
  count shrank.
- Run inside transactions; batch embeds (e.g. 64 chunks per encode call).
- After a full bulk load, run "ANALYZE doc_chunk;" so the ivfflat index is
  usable.
- CLI flags: --source-type to index one type, --limit N for testing, --dry-run.
- Use the async db pool; log progress counts (indexed / skipped / updated /
  deleted). Full type hints, logging, docstrings.
Make it runnable as: python -m jobs.index_corpus  (adjust to the package layout).
```
