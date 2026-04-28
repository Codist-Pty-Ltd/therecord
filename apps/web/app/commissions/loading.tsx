/**
 * Skeleton loading state for /commissions.
 * Mirrors the dark-hero → filter-bar → row-list layout of the real page so
 * the transition is visually continuous.
 */

export default function CommissionsLoading() {
  return (
    <div aria-busy="true" aria-label="Loading commissions">
      <section className="bg-charcoal text-cream">
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-12 md:pt-20 pb-10 md:pb-16">
          <Bar className="h-3 w-48 bg-cream/15" />
          <Bar className="h-10 md:h-14 w-5/6 max-w-3xl mt-6 bg-cream/15" />
          <Bar className="h-10 md:h-14 w-3/4 max-w-3xl mt-2 bg-cream/15" />
          <Bar className="h-4 w-4/5 max-w-2xl mt-6 bg-cream/10" />
          <Bar className="h-4 w-3/5 max-w-2xl mt-2 bg-cream/10" />

          <div className="mt-9 md:mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 border-t border-cream/10 pt-8 md:pt-10">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Bar className="h-10 md:h-14 w-20 bg-cream/15" />
                <Bar className="h-3 w-24 bg-cream/10" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="bg-cream/95 border-b border-charcoal/10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 md:py-4 flex gap-2 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Bar
              key={i}
              className="h-8 w-24 rounded-full bg-charcoal/10 shrink-0"
            />
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 pb-16">
        <Bar className="h-3 w-40 my-7 bg-charcoal/10" />

        <ul>
          {Array.from({ length: 6 }).map((_, i) => (
            <li
              key={i}
              className="border-b border-charcoal/10 py-5 md:py-7 flex flex-col gap-3"
            >
              <div className="flex gap-2">
                <Bar className="h-5 w-14 bg-charcoal/10" />
                <Bar className="h-5 w-28 bg-charcoal/10" />
                <Bar className="h-5 w-20 bg-charcoal/10" />
              </div>
              <Bar className="h-6 md:h-8 w-3/4 bg-charcoal/10" />
              <Bar className="h-4 w-1/2 bg-charcoal/10" />
              <Bar className="h-4 w-5/6 bg-charcoal/10" />
            </li>
          ))}
        </ul>
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
