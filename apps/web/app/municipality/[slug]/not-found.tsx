import Link from "next/link";

/**
 * Shown when `GET /api/municipalities/:slug` returns 404.
 */
export default function MunicipalityNotFound() {
  return (
    <div className="bg-cream min-h-[70vh] flex items-center justify-center px-4 py-16 md:py-24">
      <div className="max-w-xl w-full text-center flex flex-col items-center gap-5 md:gap-6">
        <span
          aria-hidden
          className="font-serif text-[64px] md:text-[96px] leading-none text-amber/80 tracking-tight"
        >
          404
        </span>

        <p className="label-smallcaps text-charcoal/55">Municipality not found</p>

        <h1 className="font-serif text-[28px] md:text-4xl leading-tight text-charcoal">
          We don&apos;t have this municipality on file.
        </h1>

        <p className="font-sans text-base md:text-lg text-charcoal/70 leading-relaxed max-w-md">
          Check the spelling of the slug, or browse provinces to find the metro
          or local council you need.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
          <Link
            href="/provinces"
            className="inline-flex items-center gap-2 bg-charcoal text-cream rounded-full px-5 py-2.5 font-mono text-[11px] md:text-xs uppercase tracking-[0.18em] hover:bg-amber transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-amber/40"
          >
            Browse provinces
            <span aria-hidden>→</span>
          </Link>
          <Link
            href="/"
            className="font-mono text-xs text-charcoal/60 underline-offset-4 hover:text-amber"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
