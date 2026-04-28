import type { Metadata } from "next";
import Link from "next/link";

import { DOMAINS } from "@/lib/domains";

export const metadata: Metadata = {
  title: "Domains",
  description:
    "The five domains of South African public life The Record tracks — Criminal Justice, Politics, Organised Crime, Business, and Labour.",
};

export default function DomainsPage() {
  return (
    <article className="max-w-5xl mx-auto px-4 md:px-8 py-14 md:py-24">
      <p className="font-mono text-[11px] md:text-xs uppercase tracking-[0.22em] text-amber mb-5">
        Domains
      </p>

      <h1 className="font-serif text-[36px] md:text-6xl leading-[1.05] text-charcoal max-w-3xl">
        Five corners of public life.
      </h1>

      <p className="mt-6 md:mt-8 font-sans text-base md:text-lg text-charcoal/70 max-w-2xl leading-[1.55]">
        We group every story under one of these five domains. Each touches a
        different part of the legal system.
      </p>

      <ul
        role="list"
        className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6"
      >
        {DOMAINS.map((domain) => (
          <li key={domain.value}>
            <Link
              href={`/domain/${domain.slug}`}
              className="group flex flex-col gap-3 md:gap-4 p-6 md:p-7 border border-charcoal/10 rounded-lg hover:border-amber transition-colors bg-cream"
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="text-2xl md:text-[28px]"
                >
                  {domain.icon}
                </span>
                <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-charcoal/50">
                  {domain.value.replace("_", " · ")}
                </span>
              </div>
              <h2 className="font-serif text-[24px] md:text-3xl leading-[1.15] text-charcoal group-hover:text-amber transition-colors">
                {domain.label}
              </h2>
              <p className="font-sans text-[15px] md:text-base text-charcoal/70 leading-[1.5]">
                {domain.description}
              </p>
              <span className="mt-1 md:mt-2 font-mono text-[11px] md:text-xs uppercase tracking-[0.2em] text-amber">
                Browse stories →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
