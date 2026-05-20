import type { Metadata } from "next";
import { Suspense } from "react";

import HistoryLandingClient from "@/components/History/HistoryLandingClient";
import type { PlainEnglishLevel } from "@/components/ui/PlainEnglishBox";
import { getHistoryCompare, listHistoryEras } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "South African History | The Record",
    description:
      "From pre-colonial societies to post-apartheid South Africa — land, law, economy, and people with sourced timelines.",
    openGraph: {
      title: "South African History | The Record",
      description:
        "Foundational context: eras, laws, and verified statistics for South Africa.",
      type: "website",
      siteName: "The Record",
    },
  };
}

function parseLevel(raw: string | string[] | undefined): PlainEnglishLevel {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "layperson" || v === "legal" || v === "child") return v;
  return "layperson";
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const { level: levelQ } = await searchParams;
  const initialLevel = parseLevel(levelQ);
  const [eras, compare] = await Promise.all([listHistoryEras(), getHistoryCompare()]);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-charcoal text-cream flex items-center justify-center font-mono text-sm">
          Loading history…
        </div>
      }
    >
      <HistoryLandingClient eras={eras} compare={compare} initialLevel={initialLevel} />
    </Suspense>
  );
}
