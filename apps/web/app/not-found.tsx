import Link from "next/link";

/**
 * Global 404 — any unmatched route, or `notFound()` from a page.
 * Vertical centre within `main` using the fixed header height (h-14 / md:h-16).
 */
export default function NotFound() {
  return (
    <div className="bg-cream flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 md:min-h-[calc(100vh-4rem)]">
      <div className="flex w-full max-w-lg flex-col items-center justify-center py-12 text-center">
        <p
          className="font-serif text-[120px] leading-none text-charcoal/[0.06] pointer-events-none select-none"
          aria-hidden
        >
          404
        </p>
        <h1 className="font-serif text-[32px] text-charcoal leading-tight -mt-8">
          Page not found
        </h1>
        <p className="mt-3 max-w-md font-sans text-sm text-charcoal/60">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:gap-6">
          <Link
            href="/"
            className="font-mono text-[12px] uppercase tracking-[0.14em] text-amber transition-colors hover:underline underline-offset-4"
          >
            ← Back to home
          </Link>
          <Link
            href="/search"
            className="font-mono text-[12px] uppercase tracking-[0.14em] text-charcoal/50 transition-colors hover:text-amber hover:underline underline-offset-4"
          >
            Search The Record
          </Link>
        </div>
      </div>
    </div>
  );
}
