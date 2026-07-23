# M2-03 · Nest proxy for the web (`IntelligenceClient` + controller)

**Produces:** a `IntelligenceClient.ask()` method + an API route in `apps/api`.
**Depends on:** M2-02. **Verify:** the Next.js web app can hit a Nest route that
proxies to the intelligence `/api/rag/ask`.

```
In apps/api, expose the RAG ask capability to the web through Nest, matching the
existing IntelligenceClient pattern in
apps/api/src/intelligence/intelligence.client.ts.

1. Add a method to IntelligenceClient, e.g.
   async ask(query: string, opts?: { topK?: number; sourceTypes?: string[] })
   that POSTs to `${INTELLIGENCE_URL}/api/rag/ask` and returns the typed
   response (answer, grounded, citations, sources). Reuse the existing HTTP
   client, timeout, and error handling the other client methods use.

2. Add a controller route (follow the existing intelligence controller/module
   conventions), e.g. POST /api/intelligence/ask, guarded by whatever auth the
   other Record API routes use. Validate the body with the existing DTO/
   validation approach.

3. Add/extend types so the Next.js app can consume citations (source_type +
   source_id) and deep-link to the underlying entity pages.
Do not change unrelated client methods. Keep the existing INTELLIGENCE_URL env
wiring.
```
