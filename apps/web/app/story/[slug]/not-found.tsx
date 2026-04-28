import Link from "next/link";

/**
 * Rendered by Next's App Router when the page calls `notFound()` — i.e. when
 * the NestJS API returned 404 for the requested slug.
 *
 * Server Component; gets the proper `404` status code automatically.
 */
export default function StoryNotFound() {
  return (
    <div className="bg-cream min-h-[70vh] flex items-center justify-center px-4 py-16 md:py-24">
      <div className="max-w-xl w-full text-center flex flex-col items-center gap-5 md:gap-6">
        <span
          aria-hidden
          className="font-serif text-[64px] md:text-[96px] leading-none text-amber/80 tracking-tight"
        >
          404
        </span>

        <p className="label-smallcaps text-charcoal/55">Story not on record</p>

        <h1 className="font-serif text-[28px] md:text-4xl leading-tight text-charcoal">
          We haven&apos;t tracked this story.
        </h1>

        <p className="font-sans text-base md:text-lg text-charcoal/70 leading-relaxed max-w-md">
          The slug you followed doesn&apos;t match any story in our archive.
          It may have been renamed, merged into a broader story, or never
          existed.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-charcoal text-cream rounded-full px-5 py-2.5 font-mono text-[11px] md:text-xs uppercase tracking-[0.18em] hover:bg-amber transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-amber/40"
          >
            Browse all stories
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
