export function QueryLoadingSkeleton({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="animate-pulse rounded-lg border border-charcoal/10 bg-white/50 px-4 py-8 text-center text-sm text-charcoal/50"
      role="status"
      aria-live="polite"
    >
      {label}
    </div>
  );
}
