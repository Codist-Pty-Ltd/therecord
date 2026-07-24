"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type ContentQueueRow = {
  id: string;
  title: string;
  source: string;
  source_url: string | null;
  relevance_score: number;
  suggested_action: string;
  related_entities: {
    people?: string[];
    commissions?: string[];
    siu?: string[];
  };
  summary: string | null;
  status: string;
  created_at: string;
};

type ContentQueueClientProps = {
  initialItems: ContentQueueRow[];
  stats: { pending: number; this_week: number; total_processed: number };
  apiKey: string;
  apiBase: string;
};

function scoreDots(score: number): string {
  const filled = Math.round(score * 5);
  return "●".repeat(filled) + "○".repeat(5 - filled);
}

function sourceBadgeClass(source: string): string {
  switch (source) {
    case "SIU":
      return "bg-red-100 text-red-900";
    case "SAFLII":
      return "bg-blue-100 text-blue-900";
    case "YOUTUBE":
      return "bg-rose-100 text-rose-900";
    default:
      return "bg-charcoal/10 text-charcoal";
  }
}

export default function ContentQueueClient({
  initialItems,
  stats,
  apiKey,
  apiBase,
}: ContentQueueClientProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<string>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered =
    filter === "all"
      ? items
      : filter === "pending"
        ? items.filter((i) => i.status === "pending")
        : items.filter((i) => i.source === filter);

  async function apiPost(path: string, body?: unknown) {
    const res = await fetch(`${apiBase.replace(/\/+$/, "")}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-ingestion-key": apiKey,
      },
      body: body ? JSON.stringify(body) : "{}",
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res.json();
  }

  async function ignoreItem(id: string) {
    setBusyId(id);
    try {
      await apiPost(`/api/admin/queue/${id}/ignore`, { reviewed_by: "admin-ui" });
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "ignored" } : item,
        ),
      );
    } finally {
      setBusyId(null);
    }
  }

  async function createStory(id: string) {
    setBusyId(id);
    try {
      const story = (await apiPost(`/api/admin/queue/${id}/story`, {
        reviewed_by: "admin-ui",
      })) as { slug: string };
      router.push(`/story/${story.slug}`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
      <h1 className="font-serif text-3xl text-charcoal">Content queue</h1>
      <p className="mt-2 font-sans text-sm text-charcoal/70">
        Monitoring hits from SIU, SAFLII, and YouTube — review before publishing.
      </p>

      <div className="mt-6 flex flex-wrap gap-4 font-mono text-[11px] uppercase tracking-[0.1em] text-charcoal/60">
        <span>Pending: {stats.pending}</span>
        <span>This week: {stats.this_week}</span>
        <span>Processed: {stats.total_processed}</span>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {["all", "pending", "SIU", "SAFLII", "YOUTUBE"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`rounded px-3 py-1 font-mono text-[11px] uppercase tracking-[0.1em] ${
              filter === tab
                ? "bg-charcoal text-cream"
                : "bg-charcoal/5 text-charcoal/70 hover:bg-charcoal/10"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <ul className="mt-8 space-y-4">
        {filtered.map((item) => (
          <li
            key={item.id}
            className="rounded-lg border border-charcoal/10 bg-white/70 p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${sourceBadgeClass(item.source)}`}
              >
                {item.source}
              </span>
              <span className="font-mono text-[11px] text-charcoal/50">
                {scoreDots(item.relevance_score)} {item.relevance_score.toFixed(2)}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-charcoal/40">
                {item.status}
              </span>
            </div>

            <h2 className="mt-3 font-serif text-xl text-charcoal">
              {item.source_url ? (
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber"
                >
                  {item.title}
                </a>
              ) : (
                item.title
              )}
            </h2>

            {item.summary ? (
              <p className="mt-2 font-sans text-sm text-charcoal/70 line-clamp-3">
                {item.summary}
              </p>
            ) : null}

            {(item.related_entities.people?.length ||
              item.related_entities.commissions?.length) && (
              <p className="mt-3 font-sans text-xs text-charcoal/60">
                {item.related_entities.people?.length
                  ? `People: ${item.related_entities.people.join(", ")}`
                  : null}
                {item.related_entities.commissions?.length
                  ? `${item.related_entities.people?.length ? " · " : ""}Commissions: ${item.related_entities.commissions.join(", ")}`
                  : null}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={() => createStory(item.id)}
                className="rounded bg-charcoal px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-cream hover:bg-charcoal/90 disabled:opacity-50"
              >
                Create story
              </button>
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={() => ignoreItem(item.id)}
                className="rounded border border-charcoal/20 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-charcoal/70 hover:border-charcoal/40 disabled:opacity-50"
              >
                Ignore
              </button>
              {item.source_url ? (
                <Link
                  href={item.source_url}
                  target="_blank"
                  className="rounded px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-amber hover:underline"
                >
                  Review source
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center font-sans text-sm text-charcoal/50">
          No queue items for this filter.
        </p>
      ) : null}
    </div>
  );
}
