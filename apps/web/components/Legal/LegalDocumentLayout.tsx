import type { ReactNode } from "react";

export function LegalDocumentLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  /** Displayed below the title, e.g. "25 April 2026" */
  lastUpdated?: string;
  children: ReactNode;
}) {
  return (
    <article className="max-w-[680px] mx-auto px-4 md:px-6 py-16 md:py-24 text-charcoal">
      <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-amber mb-3">
        Legal Document
      </p>
      <h1 className="font-serif text-[2.5rem] md:text-[2.75rem] leading-tight tracking-tight">
        {title}
      </h1>
      {lastUpdated ? (
        <p className="mt-3 font-mono text-[11px] text-charcoal/50">
          Last updated: {lastUpdated}
        </p>
      ) : null}
      <div className="mt-12 md:mt-16 flex flex-col gap-10 md:gap-12 font-sans text-[15px] leading-[1.8] text-charcoal/90">
        {children}
      </div>
    </article>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="flex flex-col gap-4">
      <h2 className="font-sans text-base font-medium tracking-[0.02em] uppercase text-charcoal">
        {title}
      </h2>
      <div className="flex flex-col gap-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_li]:text-charcoal/90">
        {children}
      </div>
    </section>
  );
}
