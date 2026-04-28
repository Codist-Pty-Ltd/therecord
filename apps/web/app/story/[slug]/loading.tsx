/**
 * Skeleton loading state for the story page. Mirrors the real layout so the
 * transition feels seamless: header → people strip → investigations → timeline
 * + sidebar. Uses `animate-pulse` on neutral blocks.
 *
 * This file is a Server Component — Next.js streams it automatically while
 * the real `page.tsx` suspends on the API fetch.
 */

export default function StoryLoading() {
  return (
    <article aria-busy="true" aria-label="Loading story" className="bg-cream">
      <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <HeaderSkeleton />
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <PeopleSkeleton />
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <InvestigationsSkeleton />
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 pb-16 md:pb-24">
        <div className="lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-12 lg:items-start">
          <section className="lg:col-start-1 -mx-4 md:-mx-8 lg:mx-0">
            <TimelineSkeleton />
          </section>

          <aside className="lg:col-start-2 lg:sticky lg:top-24 lg:self-start mt-8 lg:mt-0">
            <SidebarSkeleton />
          </aside>
        </div>
      </div>
    </article>
  );
}

// -----------------------------------------------------------------------------
// Primitives
// -----------------------------------------------------------------------------

function Bar({
  className = "",
  width = "w-full",
}: {
  className?: string;
  width?: string;
}) {
  return (
    <span
      aria-hidden
      className={`block rounded-md bg-charcoal/10 animate-pulse ${width} ${className}`}
    />
  );
}

function Circle({ size = "w-16 h-16" }: { size?: string }) {
  return (
    <span
      aria-hidden
      className={`block rounded-full bg-charcoal/10 animate-pulse ${size}`}
    />
  );
}

// -----------------------------------------------------------------------------
// Sections
// -----------------------------------------------------------------------------

function HeaderSkeleton() {
  return (
    <header className="flex flex-col gap-5 md:gap-7 py-6 md:py-10 lg:py-12">
      <div className="flex items-center gap-3">
        <Bar className="h-6 w-24" width="" />
        <Bar className="h-4 w-32" width="" />
      </div>
      <div className="flex flex-col gap-3">
        <Bar className="h-10 md:h-14 w-5/6" width="" />
        <Bar className="h-10 md:h-14 w-3/4" width="" />
      </div>
      <div className="flex flex-col gap-2 max-w-3xl">
        <Bar className="h-4" />
        <Bar className="h-4 w-11/12" width="" />
        <Bar className="h-4 w-4/6" width="" />
      </div>
      <div className="max-w-3xl bg-cream border-l-4 border-amber/30 rounded-r-2xl px-5 md:px-7 py-5 md:py-6 flex flex-col gap-3">
        <Bar className="h-3 w-40" width="" />
        <Bar className="h-5" />
        <Bar className="h-5 w-5/6" width="" />
      </div>
    </header>
  );
}

function PeopleSkeleton() {
  return (
    <section className="border-y border-charcoal/10 py-5 md:py-7">
      <Bar className="h-3 w-28 mb-4" width="" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 w-[148px] md:w-[168px] flex flex-col items-center gap-3"
          >
            <Circle size="w-16 h-16 md:w-[72px] md:h-[72px]" />
            <div className="flex flex-col items-center gap-1.5 w-full">
              <Bar className="h-3.5 w-3/4" width="" />
              <Bar className="h-3 w-1/2" width="" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function InvestigationsSkeleton() {
  return (
    <section className="border-b border-charcoal/10 py-6 md:py-8">
      <Bar className="h-3 w-32 mb-4" width="" />
      <div className="flex flex-col lg:flex-row gap-3 md:gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-white rounded-xl border border-charcoal/10 p-4 md:p-5 flex flex-col gap-3"
          >
            <div className="flex gap-2">
              <Bar className="h-5 w-32" width="" />
              <Bar className="h-5 w-20" width="" />
            </div>
            <Bar className="h-6 w-4/5" width="" />
            <Bar className="h-3 w-3/4" width="" />
            <Bar className="h-3 w-2/3" width="" />
          </div>
        ))}
      </div>
    </section>
  );
}

function TimelineSkeleton() {
  return (
    <div className="relative py-4 md:py-8 lg:py-12 px-4 md:px-8 lg:px-0">
      <span
        aria-hidden
        className="absolute top-0 bottom-0 w-0.5 left-10 md:left-14 lg:left-1/2 -translate-x-1/2 bg-charcoal/10"
      />
      <ol className="relative flex flex-col gap-10 md:gap-14">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="relative">
            <span
              aria-hidden
              className="absolute top-1 left-10 md:left-14 -translate-x-1/2 lg:left-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-charcoal/10 animate-pulse ring-[3px] ring-cream"
            />
            <div
              className={[
                "ml-20 md:ml-24 lg:ml-0",
                i % 2 === 0
                  ? "lg:mr-[calc(50%+2.25rem)]"
                  : "lg:ml-[calc(50%+2.25rem)] lg:mr-0",
              ].join(" ")}
            >
              <div className="bg-white rounded-xl md:rounded-2xl border border-charcoal/10 px-4 md:px-6 py-4 md:py-5 flex flex-col gap-3">
                <div className="flex gap-2">
                  <Bar className="h-5 w-28" width="" />
                  <Bar className="h-4 w-24" width="" />
                </div>
                <Bar className="h-6 w-5/6" width="" />
                <Bar className="h-6 w-3/5" width="" />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <Bar className="h-3 w-32 mb-4" width="" />
        <div className="bg-white rounded-xl border border-charcoal/10 p-4 flex flex-col gap-3">
          <Bar className="h-3 w-24" width="" />
          <Bar className="h-4 w-3/4" width="" />
          <Bar className="h-3 w-full" />
          <Bar className="h-3 w-4/5" width="" />
        </div>
      </div>
      <div>
        <Bar className="h-3 w-32 mb-4" width="" />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Bar className="h-3 w-1/3" width="" />
              <Bar className="h-4 w-5/6" width="" />
              <Bar className="h-3 w-2/3" width="" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
