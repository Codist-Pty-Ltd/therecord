/**
 * Skeleton loading state for /laws/[lawId]/[sectionId].
 *
 * Mirrors the breadcrumb → section title → plain-English panel → legal-text
 * collapsible → applied-in grid layout of the real page so the transition
 * is visually continuous (no layout jump when the data hydrates).
 */

export default function LawSectionLoading() {
  return (
    <div aria-busy="true" aria-label="Loading section">
      <header className="border-b border-charcoal/10 bg-cream">
        <div className="max-w-4xl mx-auto px-4 md:px-8 pt-8 md:pt-14 pb-8 md:pb-12">
          <Bar className="h-3 w-44 bg-charcoal/10" />

          <div className="mt-6 md:mt-8 flex flex-col gap-3 md:gap-4">
            <div className="flex items-center gap-2">
              <Bar className="h-5 w-20 bg-charcoal/10" />
              <Bar className="h-5 w-24 bg-charcoal/10" />
            </div>
            <Bar className="h-9 md:h-12 w-3/4 max-w-2xl bg-charcoal/10" />
            <Bar className="h-9 md:h-12 w-2/3 max-w-xl bg-charcoal/10" />
            <Bar className="h-3 w-1/2 max-w-md mt-2 bg-charcoal/10" />
            <Bar className="h-3 w-32 mt-1 bg-charcoal/10" />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-8 md:gap-10">
        {/* Plain English panel skeleton */}
        <div className="rounded-2xl bg-amber/[0.05] border border-amber/15 px-5 md:px-8 py-6 md:py-8">
          <div className="flex items-center gap-3">
            <Bar className="h-10 w-10 rounded-full bg-amber/15" />
            <div className="flex flex-col gap-2">
              <Bar className="h-3 w-32 bg-amber/20" />
              <Bar className="h-3 w-44 bg-charcoal/10" />
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-2.5">
            <Bar className="h-5 w-full bg-charcoal/10" />
            <Bar className="h-5 w-11/12 bg-charcoal/10" />
            <Bar className="h-5 w-3/4 bg-charcoal/10" />
          </div>
        </div>

        {/* Legal text collapsible skeleton */}
        <div className="rounded-2xl border border-charcoal/10 bg-charcoal/[0.025] px-5 md:px-7 py-4 md:py-5 flex items-center justify-between gap-4">
          <div className="flex flex-col gap-2 flex-1">
            <Bar className="h-3 w-48 bg-charcoal/10" />
            <Bar className="h-3 w-64 bg-charcoal/10" />
          </div>
          <Bar className="h-8 w-8 rounded-full bg-charcoal/10" />
        </div>

        {/* Applied-in skeleton */}
        <div className="border-t border-charcoal/10 pt-10">
          <Bar className="h-3 w-40 bg-charcoal/10" />
          <Bar className="h-8 w-72 mt-3 bg-charcoal/10" />
          <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-charcoal/10 bg-cream/60 px-5 py-5 flex flex-col gap-3"
              >
                <Bar className="h-3 w-44 bg-charcoal/10" />
                <Bar className="h-3 w-28 bg-charcoal/10" />
                <Bar className="h-5 w-3/4 mt-2 bg-charcoal/10" />
                <Bar className="h-5 w-5/6 bg-charcoal/10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Bar({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block rounded-md animate-pulse ${className}`}
    />
  );
}
