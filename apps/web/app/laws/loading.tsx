/**
 * Skeleton loading state for /laws.
 *
 * Mirrors the dark-hero → 3-stat strip → category-grouped row list of the
 * real page so the transition is visually continuous (no layout jump when
 * the data hydrates).
 */

export default function LawsLoading() {
  return (
    <div aria-busy="true" aria-label="Loading laws">
      <section className="bg-charcoal text-cream">
        <div className="max-w-5xl mx-auto px-4 md:px-8 pt-12 md:pt-20 pb-10 md:pb-16">
          <Bar className="h-3 w-44 bg-cream/15" />
          <Bar className="h-12 md:h-16 w-2/3 max-w-md mt-6 bg-cream/15" />
          <Bar className="h-4 w-4/5 max-w-2xl mt-6 bg-cream/10" />
          <Bar className="h-4 w-3/5 max-w-2xl mt-2 bg-cream/10" />

          <div className="mt-9 md:mt-12 grid grid-cols-3 gap-6 md:gap-10 border-t border-cream/10 pt-8 md:pt-10">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Bar className="h-10 md:h-14 w-16 bg-cream/15" />
                <Bar className="h-3 w-24 bg-cream/10" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 md:px-8 pb-16">
        {Array.from({ length: 3 }).map((_, group) => (
          <div key={group} className="border-b border-charcoal/10">
            <Bar className="h-3 w-32 my-5 bg-charcoal/10" />
            <ul>
              {Array.from({ length: 3 }).map((_, row) => (
                <li
                  key={row}
                  className="border-t border-charcoal/10 py-5 md:py-7 flex flex-col gap-3"
                >
                  <div className="flex gap-2">
                    <Bar className="h-5 w-16 bg-charcoal/10" />
                    <Bar className="h-5 w-24 bg-charcoal/10" />
                    <Bar className="h-5 w-20 bg-charcoal/10" />
                  </div>
                  <Bar className="h-6 md:h-7 w-3/4 bg-charcoal/10" />
                  <Bar className="h-4 w-5/6 bg-charcoal/10" />
                  <Bar className="h-3 w-32 mt-1 bg-charcoal/10" />
                </li>
              ))}
            </ul>
          </div>
        ))}
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
