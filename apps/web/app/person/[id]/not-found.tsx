import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Profile not found — The Record",
  robots: { index: false, follow: false },
};

/**
 * 404 page for /person/[id]. Shown when the API returns 404 (unknown UUID)
 * or 400 (malformed id) — both lead here rather than to a server error so
 * the reader sees something useful.
 */
export default function PersonNotFound() {
  return (
    <div className="bg-cream min-h-[70vh] flex items-center justify-center px-4 py-16 md:py-24">
      <div className="max-w-xl w-full text-center flex flex-col items-center gap-5 md:gap-6">
        <span
          aria-hidden
          className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-charcoal/10 text-charcoal text-2xl md:text-3xl font-serif"
        >
          ?
        </span>

        <p className="label-smallcaps text-charcoal/55">
          Profile not on file
        </p>

        <h1 className="font-serif text-[28px] md:text-4xl leading-tight text-charcoal">
          We couldn&apos;t find that person.
        </h1>

        <p className="font-sans text-base md:text-lg text-charcoal/70 leading-relaxed max-w-md">
          The profile you&apos;re looking for either doesn&apos;t exist on
          The Record yet, or the link you followed points to an old URL.
          People are usually easiest to find from the story or commission
          they&apos;re named in.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
          <Link
            href="/commissions"
            className="inline-flex items-center gap-2 bg-charcoal text-cream rounded-full px-5 py-2.5 font-mono text-[11px] md:text-xs uppercase tracking-[0.18em] hover:bg-amber transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-amber/40"
          >
            Browse commissions
            <span aria-hidden>→</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-transparent text-charcoal rounded-full px-5 py-2.5 font-mono text-[11px] md:text-xs uppercase tracking-[0.18em] border border-charcoal/20 hover:border-amber hover:text-amber transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/40"
          >
            Homepage
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
