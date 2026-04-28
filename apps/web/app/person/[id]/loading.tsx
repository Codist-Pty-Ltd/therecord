/**
 * Skeleton for /person/[id]. Mirrors the real page structure:
 * header → career timeline → commissions → stories.
 */

export default function PersonDetailLoading() {
  return (
    <article
      aria-busy="true"
      aria-label="Loading profile"
      className="bg-cream"
    >
      <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <HeaderSkeleton />
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 border-y border-charcoal/10">
        <Bar className="h-3 w-40 bg-charcoal/10 mb-3" />
        <Bar className="h-7 w-80 bg-charcoal/10 mb-8" />

        <div className="relative pl-10 md:pl-14">
          <span
            aria-hidden
            className="absolute top-2 bottom-2 left-4 md:left-6 w-px bg-charcoal/10"
          />
          <ol className="flex flex-col gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="relative">
                <span
                  aria-hidden
                  className="absolute top-3 -left-[1.4rem] md:-left-[1.95rem] w-3.5 h-3.5 rounded-full bg-charcoal/15 ring-[4px] ring-cream animate-pulse"
                />
                <div className="bg-white rounded-xl border border-charcoal/10 p-4 md:p-5 flex flex-col gap-2">
                  <Bar className="h-3 w-24 bg-charcoal/10" />
                  <Bar className="h-5 w-4/5 bg-charcoal/10" />
                  <Bar className="h-4 w-3/5 bg-charcoal/10" />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 border-b border-charcoal/10">
        <Bar className="h-3 w-48 bg-charcoal/10 mb-4" />
        <Bar className="h-7 w-72 bg-charcoal/10 mb-6" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="border-b border-charcoal/10 py-5 flex flex-col md:flex-row md:items-center gap-3 md:gap-6 last:border-b-0"
          >
            <Bar className="h-6 w-16 bg-charcoal/10 shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex gap-2">
                <Bar className="h-5 w-20 bg-charcoal/10" />
                <Bar className="h-5 w-24 bg-charcoal/10" />
              </div>
              <Bar className="h-5 w-5/6 bg-charcoal/10" />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function HeaderSkeleton() {
  return (
    <header className="flex flex-col md:flex-row md:items-start gap-5 md:gap-8 py-6 md:py-10 lg:py-12">
      <span
        aria-hidden
        className="shrink-0 w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full bg-charcoal/10 ring-[4px] ring-cream animate-pulse"
      />
      <div className="flex-1 flex flex-col gap-3 md:gap-4">
        <Bar className="h-5 w-24 bg-charcoal/10" />
        <Bar className="h-10 md:h-14 w-4/5 bg-charcoal/10" />
        <Bar className="h-4 w-2/3 bg-charcoal/10" />
        <Bar className="h-4 w-5/6 bg-charcoal/10" />
        <Bar className="h-4 w-3/4 bg-charcoal/10" />
      </div>
    </header>
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
