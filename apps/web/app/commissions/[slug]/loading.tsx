/**
 * Skeleton for /commissions/[slug]. Mirrors the real page: header →
 * plain-English → enabling legislation → metrics → stories → timeline →
 * people → outcome → laws.
 */

export default function CommissionDetailLoading() {
  return (
    <article
      aria-busy="true"
      aria-label="Loading commission"
      className="bg-cream"
    >
      <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <HeaderSkeleton />
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 pb-6 md:pb-10">
        <div className="bg-cream border-l-4 border-constitutional-gold/40 rounded-r-2xl px-5 md:px-7 py-5 md:py-6 flex flex-col gap-3 max-w-4xl">
          <Bar className="h-3 w-56 bg-constitutional-gold/20" />
          <Bar className="h-5 w-full bg-charcoal/10" />
          <Bar className="h-5 w-5/6 bg-charcoal/10" />
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 pb-6 md:pb-10">
        <div className="bg-white rounded-xl md:rounded-2xl border border-charcoal/10 p-5 md:p-7 flex flex-col gap-4">
          <Bar className="h-3 w-32 bg-charcoal/10" />
          <Bar className="h-6 w-4/5 bg-charcoal/10" />
          <Bar className="h-3 w-36 bg-charcoal/10" />
          <Bar className="h-5 w-1/3 bg-charcoal/10" />
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <div className="border-y border-charcoal/10 py-6 md:py-8 grid grid-cols-3 gap-4 md:gap-10">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Bar className="h-3 w-24 bg-charcoal/10" />
              <Bar className="h-10 md:h-14 w-20 bg-amber/20" />
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <div className="border-b border-charcoal/10 py-6 md:py-8">
          <Bar className="h-3 w-48 bg-charcoal/10 mb-5" />
          <div className="flex gap-3 md:gap-4 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-[280px] md:w-[320px] bg-white border border-charcoal/10 rounded-xl p-4 flex flex-col gap-2"
              >
                <Bar className="h-3 w-24 bg-charcoal/10" />
                <Bar className="h-4 w-5/6 bg-charcoal/10" />
                <Bar className="h-3 w-full bg-charcoal/10" />
                <Bar className="h-3 w-4/5 bg-charcoal/10" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="relative pl-12">
          <span
            aria-hidden
            className="absolute top-0 bottom-0 left-6 w-0.5 bg-charcoal/10"
          />
          <ol className="flex flex-col gap-10">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="relative">
                <span
                  aria-hidden
                  className="absolute top-0 left-[-1.6rem] w-10 h-10 rounded-full bg-charcoal/10 animate-pulse ring-[3px] ring-cream"
                />
                <div className="ml-4 bg-white rounded-xl border border-charcoal/10 p-4 flex flex-col gap-2">
                  <Bar className="h-4 w-28 bg-charcoal/10" />
                  <Bar className="h-5 w-5/6 bg-charcoal/10" />
                  <Bar className="h-5 w-3/5 bg-charcoal/10" />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </article>
  );
}

function HeaderSkeleton() {
  return (
    <header className="flex flex-col gap-5 md:gap-7 py-6 md:py-10 lg:py-12">
      <div className="flex gap-2">
        <Bar className="h-5 w-28 bg-charcoal/10" />
        <Bar className="h-5 w-20 bg-charcoal/10" />
      </div>
      <Bar className="h-10 md:h-14 w-5/6 bg-charcoal/10" />
      <Bar className="h-4 w-2/3 bg-charcoal/10" />
      <Bar className="h-4 w-1/2 bg-charcoal/10" />
      <div className="border-t border-charcoal/10 pt-5 flex flex-wrap gap-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Bar className="h-3 w-16 bg-charcoal/10" />
            <Bar className="h-5 w-24 bg-charcoal/10" />
          </div>
        ))}
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
