import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import HistoryEraDetailClient from "@/components/History/HistoryEraDetailClient";
import type { PlainEnglishLevel } from "@/components/ui/PlainEnglishBox";
import { getHistoryEra } from "@/lib/api";
import { isHistoryEraSlug } from "@/lib/history-constants";

export const dynamic = "force-dynamic";

function parseLevel(raw: string | string[] | undefined): PlainEnglishLevel {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "layperson" || v === "legal" || v === "child") return v;
  return "layperson";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isHistoryEraSlug(slug)) {
    return { title: "History | The Record" };
  }
  const era = await getHistoryEra(slug);
  if (!era) {
    return { title: "History | The Record" };
  }
  const desc = `${era.key_theme ?? era.summary.slice(0, 140)} — ${era.period}`;
  return {
    title: `${era.name} | South African History | The Record`,
    description: desc,
    openGraph: {
      title: `${era.name} | The Record`,
      description: desc,
      type: "website",
      siteName: "The Record",
    },
  };
}

export default async function HistoryEraPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ level?: string }>;
}) {
  const { slug } = await params;
  if (!isHistoryEraSlug(slug)) {
    notFound();
  }
  const { level: levelQ } = await searchParams;
  const initialLevel = parseLevel(levelQ);
  const era = await getHistoryEra(slug);
  if (!era) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-mono text-charcoal/60 text-sm">
          Loading era…
        </div>
      }
    >
      <HistoryEraDetailClient era={era} initialLevel={initialLevel} />
    </Suspense>
  );
}
