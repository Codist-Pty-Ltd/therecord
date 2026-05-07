"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function TransformationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 bg-cream px-4 py-16 text-center">
      <h1 className="font-serif text-2xl text-charcoal md:text-3xl">
        Something went wrong
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-charcoal/75">
        The transformation page could not be rendered. You can try again, or
        return home.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full border border-charcoal/20 bg-white px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-charcoal hover:border-amber/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/50"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full bg-charcoal px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-cream hover:bg-amber focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/50"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
