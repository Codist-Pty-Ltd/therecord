"use client";

export default function HistoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-charcoal text-cream flex flex-col items-center justify-center px-4">
      <h1 className="font-serif text-2xl mb-2">History couldn&apos;t load</h1>
      <p className="text-sm text-cream/70 text-center max-w-md mb-6">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-amber text-charcoal px-5 py-2 font-mono text-[11px] uppercase tracking-wider"
      >
        Try again
      </button>
    </div>
  );
}
