import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "State Entities — SOEs & public institutions | The Record",
  description:
    "State-owned enterprises and major public institutions on The Record — Eskom, PRASA, SAPO, and where corruption and accountability stories connect.",
  alternates: { canonical: "https://therecord.co.za/state-entities" },
};

/**
 * Hub for state entities (SOEs). Full dossiers will grow here; for now this
 * routes readers into existing coverage (SIU, stories, provinces).
 */
export default function StateEntitiesPage() {
  return (
    <div className="bg-cream">
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-8 md:py-16">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber">
          Investigate
        </p>
        <h1 className="mt-4 font-serif text-3xl text-charcoal md:text-4xl">
          State entities
        </h1>
        <p className="mt-4 max-w-prose font-sans text-sm leading-relaxed text-charcoal/70">
          Eskom, PRASA, the Post Office, public broadcasters, and other organs of state show up
          again and again in procurement and state-capture reporting. This index will grow into
          a dedicated home for each institution; meanwhile, follow the money and the
          investigations below.
        </p>

        <ul className="mt-10 space-y-3">
          <li>
            <Link
              href="/siu"
              className="block rounded-xl border border-charcoal/10 bg-white/80 px-4 py-4 transition hover:border-amber/30"
            >
              <span className="font-medium text-charcoal">SIU &amp; Special Tribunal</span>
              <span className="mt-1 block text-sm text-charcoal/60">
                Civil recoveries and proclamations touching SOEs and departments.
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/stories"
              className="block rounded-xl border border-charcoal/10 bg-white/80 px-4 py-4 transition hover:border-amber/30"
            >
              <span className="font-medium text-charcoal">Stories</span>
              <span className="mt-1 block text-sm text-charcoal/60">
                Timelines naming companies, tenders, and SOE leadership.
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/commissions"
              className="block rounded-xl border border-charcoal/10 bg-white/80 px-4 py-4 transition hover:border-amber/30"
            >
              <span className="font-medium text-charcoal">Commissions of inquiry</span>
              <span className="mt-1 block text-sm text-charcoal/60">
                Zondo, Seriti, and other bodies that reconstructed SOE capture.
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/impact"
              className="block rounded-xl border border-charcoal/10 bg-white/80 px-4 py-4 transition hover:border-amber/30"
            >
              <span className="font-medium text-charcoal">Human impact</span>
              <span className="mt-1 block text-sm text-charcoal/60">
                How diverted public money hits transport, energy, and services.
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
