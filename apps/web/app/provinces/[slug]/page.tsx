import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import AccountabilityStoryRow from "@/components/Accountability/AccountabilityStoryRow";
import ProvinceMoneyPanel from "@/components/Provinces/ProvinceMoneyPanel";
import {
  getProvince,
  getProvinceMoney,
  getProvinceStoriesPage,
} from "@/lib/api";
import { agAuditChipClass, agAuditLabel } from "@/lib/ag-audit-ui";
import { buildProvincePatternsNote } from "@/lib/province-patterns";
import { PROVINCE_STORY_FILTER_CHIPS } from "@/lib/story-category-labels";
import type { StoryCategory } from "@the-record/shared-types";

export const dynamic = "force-dynamic";

const CATEGORY_FILTER_PARAMS = new Set<string>(
  PROVINCE_STORY_FILTER_CHIPS.map((c) => c.param).filter((p) => p !== "all"),
);

interface ProvincePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category?: string }>;
}

function parseCategory(raw: string | undefined): StoryCategory | undefined {
  if (!raw || raw === "all") return undefined;
  if (CATEGORY_FILTER_PARAMS.has(raw)) return raw as StoryCategory;
  return undefined;
}

export async function generateMetadata({
  params,
}: ProvincePageProps): Promise<Metadata> {
  const { slug } = await params;
  const province = await getProvince(slug);

  if (!province) {
    return {
      title: "Province not found | The Record",
      robots: { index: false, follow: false },
    };
  }

  const title = `${province.name} Accountability | The Record`;
  const description = `Stories, money tracking and audit outcomes for ${province.name}.`;
  const canonical = `https://therecord.co.za/provinces/${province.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "The Record",
      type: "website",
    },
  };
}

export default async function ProvinceDetailPage({
  params,
  searchParams,
}: ProvincePageProps) {
  const { slug } = await params;
  const { category: categoryRaw } = await searchParams;
  const categoryFilter = parseCategory(categoryRaw);

  const [detail, money, storiesPage] = await Promise.all([
    getProvince(slug),
    getProvinceMoney(slug),
    getProvinceStoriesPage(slug, { limit: 20, story_category: categoryFilter }),
  ]);

  if (!detail) {
    notFound();
  }

  const stories = storiesPage?.data ?? [];
  const patternsNote = buildProvincePatternsNote(
    detail.name,
    detail.story_categories,
    detail.stories_count,
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
            <li>
              <Link href="/provinces" className="hover:text-amber transition-colors">
                Provinces
              </Link>
            </li>
            <li aria-hidden className="text-charcoal/30">
              ›
            </li>
            <li className="text-charcoal/70" aria-current="page">
              {detail.name}
            </li>
          </ol>
        </nav>

        <h1 className="mt-6 font-serif text-[32px] md:text-[40px] leading-tight tracking-[-0.01em] text-charcoal">
          {detail.name}
        </h1>
        <p className="mt-3 font-sans text-sm text-charcoal/60">
          {[detail.capital, detail.abbreviation, detail.premier_name ? `Premier: ${detail.premier_name}` : ""]
            .filter(Boolean)
            .join(" · ")}
        </p>

        <div className="mt-10 md:mt-12">
          <ProvinceMoneyPanel
            provinceName={detail.name}
            totalTrackedRands={detail.total_expenditure_rands}
            money={money}
            sectorRows={detail.expenditure_by_sector}
          />
        </div>

        {detail.municipalities.length > 0 ? (
          <section className="mt-14 md:mt-16" aria-label="Auditor-General findings">
            <h2 className="label-smallcaps text-charcoal/55 mb-4">
              Auditor-General findings
            </h2>
            <ul className="divide-y divide-charcoal/10 border-t border-charcoal/10">
              {detail.municipalities.map((m) => (
                <li key={m.id} className="py-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                      href={`/municipality/${m.slug}`}
                      className="font-serif text-base text-charcoal hover:text-amber"
                    >
                      {m.name}
                    </Link>
                    {m.ag_audit_outcome ? (
                      <span
                        className={`inline-flex w-max rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${agAuditChipClass(m.ag_audit_outcome)}`}
                      >
                        {agAuditLabel(m.ag_audit_outcome)}
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] text-charcoal/40">No outcome</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm italic text-amber">
              Clean audit ≠ no corruption — it describes the opinion on financial
              statements, not conduct.
            </p>
          </section>
        ) : null}

        <section className="mt-14 md:mt-16" aria-label="Stories in this province">
          <h2 className="label-smallcaps text-charcoal/55 mb-4">
            Accountability stories in {detail.name}
          </h2>

          <div className="flex flex-wrap gap-2 mb-6">
            {PROVINCE_STORY_FILTER_CHIPS.map((chip) => {
              const active =
                (chip.param === "all" && !categoryFilter) ||
                chip.param === categoryFilter;
              const href =
                chip.param === "all"
                  ? `/provinces/${detail.slug}`
                  : `/provinces/${detail.slug}?category=${chip.param}`;
              return (
                <Link
                  key={chip.param}
                  href={href}
                  className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition ${
                    active
                      ? "border-amber bg-amber/12 text-amber"
                      : "border-charcoal/15 text-charcoal/65 hover:border-amber/40 hover:text-amber"
                  }`}
                >
                  {chip.label}
                </Link>
              );
            })}
          </div>

          {stories.length === 0 ? (
            <p className="text-sm text-charcoal/55">No stories match this filter.</p>
          ) : (
            <ul className="divide-y divide-charcoal/10 border-t border-charcoal/10">
              {stories.map((s) => (
                <AccountabilityStoryRow key={s.id} story={s} />
              ))}
            </ul>
          )}

          {storiesPage && storiesPage.total > stories.length ? (
            <p className="mt-4 font-mono text-xs text-charcoal/45">
              Showing {stories.length} of {storiesPage.total} stories
            </p>
          ) : null}
        </section>

        {patternsNote ? (
          <section className="mt-14 md:mt-16 border-t border-charcoal/10 pt-10">
            <h2 className="label-smallcaps text-charcoal/55 mb-3">
              Patterns in {detail.name}
            </h2>
            <p className="max-w-3xl font-sans text-sm md:text-base text-charcoal/70 leading-relaxed">
              {patternsNote}
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
