"use client";

import Link from "next/link";
import { FormEvent, useCallback, useState } from "react";

import { askIntelligenceClient } from "@/lib/ask-client";
import {
  ragCitationPath,
  type IntelligenceAskResponse,
  type RagCitation,
  type RagRetrievedChunk,
} from "@the-record/shared-types";

const SOURCE_LABELS: Record<string, string> = {
  story: "Story",
  commission: "Commission",
  person: "Person",
  timeline_event: "Timeline event",
  siu: "SIU proclamation",
};

function sourceLabel(type: string): string {
  return SOURCE_LABELS[type] ?? type.replace(/_/g, " ");
}

function chunkForCitation(
  citation: RagCitation,
  sources: RagRetrievedChunk[],
): RagRetrievedChunk | undefined {
  return sources.find(
    (s) =>
      s.source_type === citation.source_type &&
      s.source_id === citation.source_id &&
      s.chunk_index === citation.chunk_index,
  );
}

function CitationCard({
  citation,
  sources,
}: {
  citation: RagCitation;
  sources: RagRetrievedChunk[];
}) {
  const href = ragCitationPath(citation);
  const chunk = chunkForCitation(citation, sources);
  const label = sourceLabel(String(citation.source_type));
  const excerpt = chunk?.content?.trim() ?? "";

  return (
    <li className="rounded-lg border border-charcoal/10 bg-white/60 p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono uppercase tracking-wider text-charcoal/50">
        <span>{label}</span>
        {chunk != null && (
          <span className="text-charcoal/35">
            · match {(chunk.similarity * 100).toFixed(0)}%
          </span>
        )}
      </div>
      {excerpt.length > 0 && (
        <p className="mt-2 text-sm leading-relaxed text-charcoal/80 line-clamp-4">
          {excerpt}
        </p>
      )}
      {href ? (
        <Link
          href={href}
          className="mt-3 inline-flex text-sm font-medium text-teal-800 underline-offset-2 hover:underline"
        >
          View source →
        </Link>
      ) : (
        <p className="mt-3 text-xs text-charcoal/45">Source link unavailable</p>
      )}
    </li>
  );
}

export default function AskTheRecordForm() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IntelligenceAskResponse | null>(null);

  const onSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const q = query.trim();
      if (q.length < 3) {
        setError("Enter at least 3 characters.");
        return;
      }
      setLoading(true);
      setError(null);
      setResult(null);
      void (async () => {
        try {
          const data = await askIntelligenceClient(q);
          setResult(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
          setLoading(false);
        }
      })();
    },
    [query],
  );

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label htmlFor="ask-query" className="sr-only">
          Your question
        </label>
        <textarea
          id="ask-query"
          name="query"
          rows={3}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. What is the SIU and how does it recover money?"
          className="w-full resize-y rounded-lg border border-charcoal/15 bg-white px-4 py-3 font-sans text-base text-charcoal placeholder:text-charcoal/40 focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700/30"
          disabled={loading}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading || query.trim().length < 3}
            className="rounded-md bg-charcoal px-5 py-2.5 font-sans text-sm font-medium text-cream transition hover:bg-charcoal/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Searching corpus…" : "Ask"}
          </button>
          <p className="text-xs text-charcoal/50 max-w-md">
            Answers are grounded in The Record corpus only. Citations link to
            stories, commissions, people, and SIU records when available.
          </p>
        </div>
      </form>

      {error != null && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      )}

      {result != null && (
        <section aria-live="polite" className="flex flex-col gap-6">
          <div className="rounded-xl border border-charcoal/10 bg-cream/80 p-6 md:p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-charcoal/45 mb-3">
              {result.grounded ? "Grounded answer" : "Response"}
            </p>
            <div className="font-sans text-base md:text-lg leading-relaxed text-charcoal whitespace-pre-wrap">
              {result.answer}
            </div>
            {!result.grounded && (
              <p className="mt-4 text-sm text-charcoal/55">
                Not enough matching corpus material — try rephrasing or use{" "}
                <Link href="/search" className="underline underline-offset-2">
                  search
                </Link>{" "}
                to browse records directly.
              </p>
            )}
          </div>

          {result.citations.length > 0 && (
            <div>
              <h2 className="font-serif text-xl text-charcoal mb-4">
                Sources ({result.citations.length})
              </h2>
              <ul className="flex flex-col gap-3">
                {result.citations.map((c, i) => (
                  <CitationCard
                    key={`${c.source_type}-${c.source_id}-${c.chunk_index}-${i}`}
                    citation={c}
                    sources={result.sources}
                  />
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
