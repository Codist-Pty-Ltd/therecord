import type { Metadata } from "next";
import Link from "next/link";

import ProvinceIndexCards from "@/components/Provinces/ProvinceIndexCards";
import { listProvinces } from "@/lib/api";

export const dynamic = "force-dynamic";

const CANONICAL = "https://therecord.co.za/provinces";

export const metadata: Metadata = {
  title: "Provinces | The Record",
  description:
    "South African public money, accountability stories, and audit intelligence by province.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Provinces | The Record",
    description:
      "South African public money, accountability stories, and audit intelligence by province.",
    url: CANONICAL,
    siteName: "The Record",
    type: "website",
  },
};

export default async function ProvincesIndexPage() {
  const provinces = await listProvinces();
  const sorted = [...provinces].sort(
    (a, b) => b.total_expenditure_rands - a.total_expenditure_rands,
  );

  return (
    <div className="bg-cream pb-20 md:pb-28">
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-10">
        <nav
          aria-label="Breadcrumb"
          className="font-sans text-[12px] text-charcoal/50"
        >
          <ol className="flex flex-wrap items-center gap-x-1.5">
            <li>
              <Link href="/" className="hover:text-amber transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden className="text-charcoal/30">
              ›
            </li>
            <li className="text-charcoal/70" aria-current="page">
              Provinces
            </li>
          </ol>
        </nav>

        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-amber">
          Provincial accountability intelligence
        </p>
        <h1 className="mt-3 font-serif text-[32px] md:text-[40px] leading-tight tracking-[-0.01em] text-charcoal max-w-3xl">
          South Africa by Province
        </h1>
        <p className="mt-4 max-w-2xl font-sans text-sm md:text-base text-charcoal/65 leading-relaxed">
          Public money, accountability stories, and audit outcomes tracked across
          all 9 provinces.
        </p>

        <div className="mt-12 md:mt-14">
          {sorted.length === 0 ? (
            <p className="text-sm text-charcoal/55">No province data yet.</p>
          ) : (
            <ProvinceIndexCards provinces={sorted} />
          )}
        </div>
      </div>
    </div>
  );
}
