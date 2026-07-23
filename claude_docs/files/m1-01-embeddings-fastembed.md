# M1-01 · Embeddings (fastembed, lazy-loaded)

**Produces:** `apps/intelligence/core/embeddings.py`. **Depends on:** M0.
**Verify:** encoding a string returns a 384-length vector; the model loads only
on first call.

```
Create apps/intelligence/core/embeddings.py providing CPU embeddings via
fastembed (ONNX) — do NOT use sentence-transformers or torch.

Requirements:
- Use fastembed.TextEmbedding with model name from settings.embedding_model
  (default BAAI/bge-small-en-v1.5, 384-dim).
- LAZY singleton: the model is constructed on first use, cached at module level,
  guarded so concurrent first-calls don't double-load. Never load at import time
  (existing endpoints and /health must stay unaffected).
- def embed_texts(texts: list[str]) -> list[list[float]]: batched encode,
  returns plain python lists of floats (length == settings.embedding_dim).
- def embed_text(text: str) -> list[float]: convenience wrapper.
- Assert/raise clearly if a produced vector length != settings.embedding_dim.
- Add fastembed to the intelligence runtime requirements. In the Dockerfile,
  add an OPTIONAL build-time pre-download step (run a tiny script that
  instantiates TextEmbedding once) so the ONNX model is baked into the image and
  there is no first-request download on the server — guard it so the build still
  works offline if the download fails (warn, continue; runtime will fetch+cache).
Full type hints, logging, docstrings.
```
