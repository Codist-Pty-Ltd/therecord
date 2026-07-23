# M0-02 · Config / settings

**Produces:** Pydantic settings for the intelligence service. **Depends on:**
nothing. **Verify:** `python -c "from config import get_settings; print(get_settings().embedding_dim)"`.

```
In apps/intelligence, add settings using pydantic-settings (Pydantic v2). FIRST
check whether a config/settings module already exists in apps/intelligence — if
it does, EXTEND it rather than creating a new one. Otherwise create
apps/intelligence/config.py.

Settings fields (env-driven, .env):
  app_env: Literal["dev","staging","prod"] = "dev"
  database_url: str                       # consumed as-is; already %23-encoded
  anthropic_api_key: str | None = None     # used in M2, optional now
  anthropic_model: str = "claude-sonnet-4-6"
  embedding_model: str = "BAAI/bge-small-en-v1.5"
  embedding_dim: int = 384
  db_pool_min: int = 1
  db_pool_max: int = 5
  rag_min_similarity: float = 0.25        # retrieval floor, tune later
  rag_top_k: int = 6
  log_level: str = "INFO"

Use SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore").
Expose a cached accessor get_settings() -> Settings (lru_cache). Full type
hints, module docstring, never log secret values. If the existing service
already loads ANTHROPIC_API_KEY for the summary endpoint, reuse that variable
name so there is one source of truth.
```
