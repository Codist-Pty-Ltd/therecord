# The Record — Intelligence Layer

Python service expanding the existing FastAPI/spaCy NLP service into a proper
retrieval + scoring layer over The Record's public-accountability corpus.

**Purpose:** RAG over the commission/SIU data, better entity linking, and a real
relevance model to replace the static `relevance_score = 0.4` threshold in the
YouTube agent.

**Dual goal:** ships real value into a live product *and* stands alone as a
portfolio piece (NLP + RAG + pgvector + a trained scorer — all current,
senior-flavoured talking points).

---

## Why this one first

- The Python service already exists (FastAPI + spaCy 3.7.4 on `:8001`, internal,
  on `therecord-network`). You're extending, not bootstrapping.
- Postgres 16 is already there — adding `pgvector` is a one-extension change, and
  it advances your PostgreSQL-depth goal.
- Fast visible results: a working "ask a question, get cited answers from the
  corpus" loop is achievable in the first milestone.

---

## Where it fits the existing stack

```
therecord-network (docker)
├── web        Next.js 15      :3090
├── api        NestJS 10       :3091
├── nlp        FastAPI/spaCy   :8001  (internal)   ← this project lives/grows here
└── db         PostgreSQL 16   :5432  (internal)   ← + pgvector extension
```

Server: `65.109.7.45`, user `therecord`, app root `/opt/therecord/app`.
Reminder from prior ops: `docker restart` does **not** reload `.env` — use
`compose down/up`. `DATABASE_URL` needs `%23` for the `#` in the password.

Proposed location in the repo:

```
/opt/therecord/app/services/intelligence/
```

(Either extend the current `nlp` container, or split a second `intelligence`
container on the same network sharing the Postgres. Recommend a **second
container** so spaCy request-path latency stays clean and the heavier
embedding/RAG work runs independently. Decision noted in "Open decisions".)

---

## Scope — three workstreams

### A. RAG over the corpus
Retrieval-augmented Q&A / summarisation over `Story`, `TimelineEvent`,
`Commission`, `Person`, and SIU entities.

- Chunk + embed corpus documents into a `pgvector` column.
- Retrieve top-k by cosine similarity, optionally re-rank.
- Generate grounded answers with **inline source citations** back to the entity
  IDs (so the front end can deep-link — matches The Record's accountability angle).
- Never fabricate: if retrieval is weak, say so. (Same discipline as the YouTube
  agent's "never auto-publish".)

### B. Entity linking
Tighten spaCy NER output into canonical records.

- Resolve mentions ("Cyril R.", "President Ramaphosa") to a single `Person` row.
- Link organisations/commissions to existing entities; flag new candidates for
  human review rather than auto-creating.
- Confidence score per link; below threshold → review queue, not silent insert.

### C. Relevance model (replace the `0.4` constant)
Turn the YouTube agent's magic number into an actual scorer.

- **Phase 1 (no labels yet):** embedding similarity of a transcript against a
  centroid of known-relevant material → calibrated score. Drop-in for the
  current threshold.
- **Phase 2 (once you have labels):** lightweight classifier
  (logistic regression / LightGBM) on transcript + metadata features. Versioned,
  with an offline eval so you can prove a number moved.
- Keep the same contract: agent runs Mon 02:00 SAST, scores, **never
  auto-publishes** — it just ranks the review queue better.

---

## Tech stack

| Concern        | Choice                                   | Note |
|----------------|------------------------------------------|------|
| API            | FastAPI + Uvicorn                        | matches existing service |
| NLP            | spaCy 3.7.4                              | already pinned — keep it |
| Embeddings     | `sentence-transformers` (local)          | e.g. `BAAI/bge-small-en-v1.5`; free, runs on the box, no per-call cost |
| Vector store   | `pgvector` in the existing Postgres 16   | no new infra |
| DB driver      | `psycopg` (v3) + `pgvector` python adapter | async-friendly |
| Generation     | Claude API (you already use it in EngineIQ) | reuse the same key/pattern |
| Validation     | Pydantic v2                              | request/response + settings |
| Classifier     | scikit-learn / LightGBM (Phase 2)        | small, ships easily |
| Tests          | pytest + testcontainers-python (Postgres)| mirrors your .NET Testcontainers habit |
| Lint/format    | ruff + black; mypy for types             | CI gate |

Local embeddings keep cost at zero and respect the SA/low-bandwidth context;
swap to a hosted embedding API later behind the same interface if needed.

---

## Project structure

```
services/intelligence/
├── app/
│   ├── main.py                 # FastAPI app, routers, lifespan
│   ├── config.py               # Pydantic settings (env-driven)
│   ├── db.py                   # async pool, pgvector registration
│   ├── api/
│   │   ├── rag.py              # POST /rag/query
│   │   ├── entities.py         # POST /entities/link
│   │   └── relevance.py        # POST /relevance/score
│   ├── core/
│   │   ├── embeddings.py       # encode(text) -> vector; batched
│   │   ├── chunking.py         # corpus -> chunks (entity-aware)
│   │   ├── retrieval.py        # top-k cosine, optional re-rank
│   │   ├── generation.py       # Claude call, grounded + cited
│   │   ├── linking.py          # mention -> canonical Person/Commission
│   │   └── relevance.py        # phase1 similarity / phase2 model
│   ├── models/                 # Pydantic request/response schemas
│   └── jobs/
│       └── index_corpus.py     # (re)embed corpus into pgvector
├── ml/
│   ├── train_relevance.py      # Phase 2 training script
│   ├── eval_relevance.py       # offline metrics (PR-AUC, etc.)
│   └── artifacts/              # versioned model files (gitignored or LFS)
├── migrations/
│   └── 001_pgvector_embeddings.sql
├── tests/
│   ├── test_retrieval.py
│   ├── test_linking.py
│   └── test_relevance.py
├── Dockerfile
├── pyproject.toml
├── requirements.txt            # or uv / poetry lock
└── README.md
```

---

## Database changes

```sql
-- migrations/001_pgvector_embeddings.sql
CREATE EXTENSION IF NOT EXISTS vector;

-- one chunk table referencing source entities, keeps RAG citations honest
CREATE TABLE IF NOT EXISTS doc_chunk (
    id           BIGSERIAL PRIMARY KEY,
    source_type  TEXT NOT NULL,         -- 'story' | 'commission' | 'siu' | ...
    source_id    BIGINT NOT NULL,       -- FK-ish back to the originating row
    chunk_index  INT  NOT NULL,
    content      TEXT NOT NULL,
    embedding    vector(384),           -- bge-small = 384 dims
    created_at   TIMESTAMPTZ DEFAULT now()
);

-- ANN index; ivfflat needs ANALYZE after a bulk load
CREATE INDEX IF NOT EXISTS doc_chunk_embedding_idx
    ON doc_chunk USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS doc_chunk_source_idx
    ON doc_chunk (source_type, source_id);
```

Note: dim count must match the model. If you swap `bge-small` (384) for a larger
model, the column type changes — pick before the first bulk index.

---

## Milestones

**M0 — Plumbing (½ day)**
Container on `therecord-network`, health endpoint, Pydantic settings reading the
existing `.env`, async Postgres pool, `pgvector` registered. CI green and
deployable. *Done = `/health` returns 200 in prod behind the SSH tunnel.*

**M1 — Embed + retrieve (1–2 days)**
`index_corpus` job embeds existing stories/commissions/SIU into `doc_chunk`.
`POST /rag/query` returns top-k chunks with source IDs and similarity scores. No
generation yet. *Done = a query returns the right chunks for a known topic.*

**M2 — Grounded answers (1 day)**
Add Claude generation over retrieved chunks, with inline citations to
`source_type/source_id`. Refuse / hedge when retrieval is weak.
*Done = answer + clickable sources for 5 sample questions.*

**M3 — Relevance scorer Phase 1 (1 day)**
`POST /relevance/score`: similarity-to-centroid score. Wire the Monday agent to
call it instead of the hardcoded `0.4`. *Done = agent ranks the review queue by
real scores; still never auto-publishes.*

**M4 — Entity linking + Phase 2 scorer (2–3 days)**
Mention → canonical resolution with a confidence-gated review queue. Once you've
labelled a batch of agent outputs, train the LightGBM scorer, eval offline,
and ship if it beats Phase 1. *Done = an eval number you can quote.*

---

## CI/CD

Mirror your existing GitHub Actions → GHCR → Hetzner pattern.

```yaml
# .github/workflows/intelligence.yml (sketch)
name: intelligence
on:
  push:
    paths: ["services/intelligence/**"]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install -r services/intelligence/requirements.txt
      - run: ruff check services/intelligence
      - run: mypy services/intelligence/app
      - run: pytest services/intelligence -q   # testcontainers spins Postgres
  build-push:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - run: |
          docker build -t ghcr.io/codist-pty-ltd/therecord-intelligence:${{ github.sha }} \
            services/intelligence
          docker push ghcr.io/codist-pty-ltd/therecord-intelligence:${{ github.sha }}
```

Remember GHCR wants the **lowercase** org path (`codist-pty-ltd`) — same gotcha
you hit during the org migration. Deploy step pulls + `compose up -d` for the
`intelligence` service only.

---

## Testing

- **Unit:** chunking, embedding shape, similarity math, linking confidence gates.
- **Integration:** spin Postgres via testcontainers-python, load fixtures, assert
  retrieval returns expected `source_id`s. Same philosophy as your .NET
  Testcontainers suites.
- **Eval (Phase 2):** `eval_relevance.py` reports PR-AUC / precision@k on a
  held-out label set so model changes are evidence-backed, not vibes.

---

## Local dev quickstart

```bash
cd services/intelligence
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# bring up Postgres + the service against therecord-network locally
docker compose -f docker-compose.dev.yml up -d db
python -m app.jobs.index_corpus          # embed the corpus
uvicorn app.main:app --reload --port 8002
```

---

## Portfolio talking points (for interviews)

- "Built a RAG layer over a South African public-accountability corpus —
  pgvector retrieval with citation-grounded generation that refuses to answer
  when evidence is thin."
- "Replaced a hardcoded relevance threshold with a calibrated, evaluated scoring
  model; measured the lift with offline PR-AUC."
- "Entity resolution with a human-in-the-loop review queue — chose not to
  auto-write low-confidence links."

All three are *systems-level, judgement-driven* stories — directly the "senior
enough" signal you've been told you're missing.

---

## Open decisions

1. **Same container vs. separate `intelligence` container** — recommend separate,
   to keep spaCy request latency clean. Confirm before M0.
2. **Embedding model / dimension** — `bge-small` (384) by default; lock this
   before the first bulk index since the column dim is fixed.
3. **Re-ranking** — skip for M1; add a cross-encoder re-rank only if top-k quality
   is weak after real queries.
4. **Label capture** — decide where Phase 2 labels come from (manual review of
   agent output is the natural source). Start logging them at M3.
