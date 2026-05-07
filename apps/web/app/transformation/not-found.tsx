import Link from "next/link";

export default function TransformationNotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-cream px-4 py-16 md:py-24">
      <div className="flex w-full max-w-xl flex-col items-center gap-5 text-center md:gap-6">
        <span
          aria-hidden
          className="font-serif text-[64px] leading-none tracking-tight text-amber/80 md:text-[96px]"
        >
          404
        </span>
        <p className="label-smallcaps text-charcoal/55">Transformation brief unavailable</p>
        <h1 className="font-serif text-[28px] leading-tight text-charcoal md:text-4xl">
          This explainer is not in the database yet.
        </h1>
        <p className="max-w-md font-sans text-base leading-relaxed text-charcoal/70">
          Run the B-BBEE seed on the API, or check that the policy and story
          slugs match this deployment.
        </p>
        <Link
          href="/stories"
          className="mt-1 inline-flex items-center gap-2 rounded-full bg-charcoal px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-cream transition-colors hover:bg-amber focus:outline-none focus-visible:ring-4 focus-visible:ring-amber/40"
        >
          Browse stories
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}
