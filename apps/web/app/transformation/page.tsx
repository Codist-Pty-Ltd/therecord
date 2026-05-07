import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { getStory, getTransformationPolicy } from "@/lib/api";

import TransformationPageClient from "./TransformationPageClient";

export const dynamic = "force-dynamic";

const POLICY_SLUG = "broad-based-black-economic-empowerment";
const STORY_SLUG = "bbee-transformation-south-africa";

export async function generateMetadata(): Promise<Metadata> {
  const policy = await getTransformationPolicy(POLICY_SLUG);
  const title = policy
    ? `${policy.abbreviation ?? policy.name} — economic transformation explained`
    : "Economic transformation — The Record";
  return {
    title,
    description:
      policy?.purpose_summary ??
      "B-BBEE, the history behind it, both sides of the debate, and how South Africans can participate.",
  };
}

function TransformationLoadingFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-cream px-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-charcoal/40">
        Loading transformation brief…
      </p>
    </div>
  );
}

export default async function TransformationPage() {
  const [policy, story] = await Promise.all([
    getTransformationPolicy(POLICY_SLUG),
    getStory(STORY_SLUG),
  ]);

  if (!policy || !story) {
    notFound();
  }

  return (
    <Suspense fallback={<TransformationLoadingFallback />}>
      <TransformationPageClient policy={policy} story={story} />
    </Suspense>
  );
}
