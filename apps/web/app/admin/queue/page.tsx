import ContentQueueClient, {
  type ContentQueueRow,
} from "@/components/Admin/ContentQueueClient";

export const dynamic = "force-dynamic";

async function fetchQueue(): Promise<{
  items: ContentQueueRow[];
  stats: { pending: number; this_week: number; total_processed: number };
}> {
  const apiBase = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  const apiKey = process.env.INGESTION_API_KEY;

  if (!apiBase || !apiKey) {
    return { items: [], stats: { pending: 0, this_week: 0, total_processed: 0 } };
  }

  const headers = {
    Accept: "application/json",
    "x-ingestion-key": apiKey,
  };

  const [itemsRes, statsRes] = await Promise.all([
    fetch(`${apiBase.replace(/\/+$/, "")}/api/admin/queue`, {
      headers,
      cache: "no-store",
    }),
    fetch(`${apiBase.replace(/\/+$/, "")}/api/admin/queue/stats`, {
      headers,
      cache: "no-store",
    }),
  ]);

  if (!itemsRes.ok || !statsRes.ok) {
    return { items: [], stats: { pending: 0, this_week: 0, total_processed: 0 } };
  }

  return {
    items: (await itemsRes.json()) as ContentQueueRow[],
    stats: (await statsRes.json()) as {
      pending: number;
      this_week: number;
      total_processed: number;
    },
  };
}

export default async function AdminQueuePage() {
  const apiKey = process.env.INGESTION_API_KEY ?? "";
  const { items, stats } = await fetchQueue();

  if (!apiKey) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-serif text-2xl text-charcoal">Content queue</h1>
        <p className="mt-4 font-sans text-sm text-charcoal/70">
          Set <code className="font-mono text-xs">INGESTION_API_KEY</code> in the web
          container environment to load the editorial queue.
        </p>
      </div>
    );
  }

  return (
    <ContentQueueClient
      initialItems={items}
      stats={stats}
      apiKey={apiKey}
      apiBase={process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? ""}
    />
  );
}
