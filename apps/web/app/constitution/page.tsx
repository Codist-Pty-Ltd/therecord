import type { Metadata } from "next";
import Link from "next/link";

import { listConstitutionSections } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Constitution — Your rights, explained | The Record",
  description:
    "The South African Constitution in plain language — section by section. Rights, duties, and how they connect to accountability news.",
  alternates: { canonical: "https://therecord.co.za/constitution" },
};

export default async function ConstitutionIndexPage() {
  const sections = await listConstitutionSections();

  return (
    <div className="bg-cream">
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-8 md:py-16">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber">
          The Law
        </p>
        <h1 className="mt-4 font-serif text-3xl text-charcoal md:text-4xl">
          Constitution
        </h1>
        <p className="mt-4 max-w-prose font-sans text-sm leading-relaxed text-charcoal/70">
          Your rights and the structure of South Africa&apos;s democracy — explained in plain
          English. Tap a section to read the editorial summary; deeper legal text can follow
          on each page.
        </p>

        {sections.length === 0 ? (
          <p className="mt-10 text-sm text-charcoal/55">
            Constitutional sections are not available — check the API connection.
          </p>
        ) : (
          <ul className="mt-10 divide-y divide-charcoal/10 border-y border-charcoal/10">
            {sections.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/constitution/${row.section_number}`}
                  className="flex min-h-[52px] flex-col justify-center py-4 transition hover:bg-amber/[0.04]"
                >
                  <span className="font-mono text-[11px] text-legal-blue">
                    Section {row.section_number}
                  </span>
                  <span className="mt-1 font-medium text-charcoal">{row.section_title}</span>
                  <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-charcoal/55">
                    {row.plain_english}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
