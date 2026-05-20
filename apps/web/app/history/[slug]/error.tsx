"use client";

export default function HistoryEraError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-cream text-charcoal flex flex-col items-center justify-center px-4">
      <h1 className="font-serif text-2xl mb-2">This era couldn&apos;t load</h1>
      <p className="text-sm text-charcoal/70 text-center max-w-md mb-6">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-charcoal text-cream px-5 py-2 font-mono text-[11px] uppercase tracking-wider"
      >
        Try again
      </button>
    </div>
  );
}
