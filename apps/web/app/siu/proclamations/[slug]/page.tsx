import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getSiuProclamation } from "@/lib/api";
import { formatRandsHero, proclamationStatusBadgeClasses } from "@/lib/siu";

export const dynamic = "force-dynamic";

interface PageParams {
  slug: string;
}

interface PageProps {
  params: Promise<PageParams>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const p = await getSiuProclamation(slug);
  if (!p) {
    return { title: "Proclamation not found | The Record", robots: { index: false } };
  }
  const title = `${p.proclamation_number} · ${p.title} | The Record`;
  return {
    title,
    description: p.plain_english_summary.slice(0, 180),
    openGraph: { title, description: p.plain_english_summary.slice(0, 200) },
  };
}

export default async function SiuProclamationPage({ params }: PageProps) {
  const { slug } = await params;
  const p = await getSiuProclamation(slug);
  if (!p) {
    notFound();
  }

  const statusCls = proclamationStatusBadgeClasses(p.status);

  return (
    <article className="bg-cream min-h-[60vh]">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <nav
          className="font-mono text-[11px] uppercase tracking-[0.16em] text-charcoal/50 mb-6"
          aria-label="Breadcrumb"
        >
          <Link href="/siu" className="hover:text-amber transition-colors">
            SIU
          </Link>
          <span className="text-charcoal/30 mx-2">›</span>
          <span className="text-charcoal/70">{p.proclamation_number}</span>
        </nav>

        <p className="font-mono text-[10px] md:text-[11px] text-[#E07A5F] tabular-nums tracking-[0.12em] mb-2">
          {p.proclamation_number}
        </p>
        <h1 className="font-serif text-[1.75rem] md:text-[2.25rem] text-charcoal leading-tight">
          {p.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={`font-mono text-[10px] uppercase tracking-[0.12em] rounded-full border px-2.5 py-0.5 ${statusCls}`}
          >
            {p.status.replace(/_/g, " ")}
          </span>
          {p.signed_date ? (
            <span className="font-mono text-[11px] text-charcoal/50">
              Signed {p.signed_date}
            </span>
          ) : null}
        </div>
        <p className="mt-6 font-sans text-[1rem] leading-relaxed text-charcoal/80">
          {p.plain_english_summary}
        </p>

        {p.outcome?.actual_recovered_rands ? (
          <p className="mt-6 font-serif text-2xl text-amber">
            {formatRandsHero(p.outcome.actual_recovered_rands)} recovered
          </p>
        ) : null}

        <section className="mt-10 border-t border-charcoal/10 pt-8">
          <h2 className="label-smallcaps text-charcoal/50">Laws & Constitution</h2>
          <p className="font-sans text-sm text-charcoal/65 mt-2">
            This proclamation is linked to statute and constitutional sections by
            usage type. See the Zondo and law-section pages for the same data in
            context.
          </p>
          <ul className="mt-4 space-y-2 font-sans text-sm text-charcoal/80">
            {(
              [
                "enabling",
                "investigated",
                "violated",
                "recovered_under",
              ] as const
            ).map((k) => {
              const items = p.law_sections_by_usage[k] ?? [];
              if (items.length === 0) return null;
              return (
                <li key={k}>
                  <span className="font-mono text-amber/90 text-xs uppercase">
                    {k.replace(/_/g, " ")}
                  </span>
                  <ul className="ml-3 mt-1 list-disc">
                    {items.map((row) => (
                      <li key={row.id}>
                        {row.law_section
                          ? `${row.law_section.law.short_name} ${row.law_section.section_number}`
                          : null}
                        {row.constitution_section
                          ? `Constitution s${row.constitution_section.section_number}`
                          : null}
                        {row.relevance ? ` — ${row.relevance}` : ""}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </article>
  );
}
