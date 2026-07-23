# M4-03 · Relevance Phase 2 — train + eval

**Produces:** `apps/intelligence/ml/train_relevance.py` +
`ml/eval_relevance.py`. **Depends on:** M3-03 (labels accumulating). **Verify:**
training emits a versioned artifact; eval prints PR-AUC / precision@k vs the
Phase 1 centroid baseline.

```
Create a Phase 2 relevance model trained on the relevance_label table once it
has human_label values.

ml/train_relevance.py:
- Load labelled rows (human_label IS NOT NULL) from relevance_label.
- Features: text embedding (core.embeddings) concatenated with cheap metadata
  features (title length, channel one-hot/hashing, heuristic_score, centroid
  score). Keep feature construction in a shared function reused at inference.
- Train a LightGBM (or sklearn LogisticRegression fallback) binary classifier.
- Save a VERSIONED artifact to ml/artifacts/relevance_<timestamp>.joblib plus a
  small JSON sidecar (model type, feature spec, embedding model, train size,
  date). gitignore the artifacts dir (already in .gitignore).

ml/eval_relevance.py:
- Held-out split (time-based or stratified). Report PR-AUC, ROC-AUC,
  precision@k, recall, and the chosen-threshold confusion matrix.
- Compare against the Phase 1 centroid score as a baseline so you can SHOW the
  lift. Print a compact table.
Add lightgbm, scikit-learn, joblib to dev/ML requirements (NOT the runtime web
image unless inference needs them — keep them in a separate optional group).
Full type hints, logging, docstrings. Add a tiny smoke test that runs training
on a handful of synthetic rows end-to-end.
```
