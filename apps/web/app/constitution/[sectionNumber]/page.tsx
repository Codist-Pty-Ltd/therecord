import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ sectionNumber: string }>;
}

async function fetchSection(n: number) {
  const base = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!base) return null;
  const url = `${base.replace(/\/+$/, "")}/api/legal/constitution/${n}`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return (await res.json()) as {
      section_number: number;
      section_title: string;
      plain_english: string;
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { sectionNumber } = await params;
  const n = Number(sectionNumber);
  if (!Number.isFinite(n)) return { title: "Constitution" };
  const row = await fetchSection(n);
  if (!row) return { title: `Section ${n}` };
  return {
    title: `Constitution · s${row.section_number}`,
    description: row.plain_english.slice(0, 160),
  };
}

export default async function ConstitutionSectionPage({ params }: PageProps) {
  const { sectionNumber } = await params;
  const n = Number(sectionNumber);
  if (!Number.isFinite(n)) notFound();

  const row = await fetchSection(n);
  if (!row) notFound();

  return (
    <article className="max-w-3xl mx-auto px-4 md:px-8 py-12 md:py-16">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber">
        Constitution of the Republic of South Africa, 1996
      </p>
      <h1 className="mt-4 font-serif text-3xl md:text-4xl text-charcoal">
        Section {row.section_number}
      </h1>
      <p className="mt-2 text-lg text-charcoal/80">{row.section_title}</p>
      <div className="mt-8 font-sans text-base leading-relaxed text-charcoal/75">
        {row.plain_english}
      </div>
      <p className="mt-10">
        <Link
          href="/"
          className="font-mono text-[11px] uppercase tracking-[0.16em] text-amber hover:underline"
        >
          ← Back to home
        </Link>
      </p>
    </article>
  );
}
