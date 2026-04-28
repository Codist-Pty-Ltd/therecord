interface Block {
  icon: string;
  title: string;
  body: string;
}

const BLOCKS: readonly Block[] = [
  {
    icon: "📰",
    title: "Not just news",
    body: "We track how a story develops over weeks and months — every arrest, every hearing, every judgment in one place.",
  },
  {
    icon: "⚖️",
    title: "Law in plain English",
    body: "Every charge is explained. Every law is linked to its section and its meaning. No jargon, no guesswork.",
  },
  {
    icon: "🧵",
    title: "The full thread",
    body: "From the first allegation to the final verdict. We update the timeline as the story moves — so the record is never out of date.",
  },
];

/**
 * Explainer section — sits directly beneath the live story. Three blocks
 * stacked on mobile, three columns on desktop. Server component; no motion.
 */
export default function WhatThisIs() {
  return (
    <section
      aria-labelledby="what-this-is-heading"
      className="bg-white/60 border-y border-charcoal/10"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-14 md:py-20">
        <div className="flex flex-col gap-3 md:gap-4 mb-10 md:mb-14 max-w-2xl">
          <p className="label-smallcaps text-amber">What this is</p>
          <h2
            id="what-this-is-heading"
            className="font-serif text-3xl md:text-4xl lg:text-5xl leading-[1.1] tracking-[-0.01em] text-charcoal"
          >
            A different way to follow South African news.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
          {BLOCKS.map((block) => (
            <article
              key={block.title}
              className="flex flex-col gap-4 md:gap-5 p-6 md:p-7 bg-cream rounded-lg border border-charcoal/8 hover:border-amber/50 transition-colors"
            >
              <span
                aria-hidden
                className="inline-flex w-12 h-12 md:w-14 md:h-14 items-center justify-center rounded-full bg-white border border-charcoal/10 text-2xl md:text-3xl"
              >
                {block.icon}
              </span>
              <h3 className="font-serif text-xl md:text-2xl text-charcoal leading-tight">
                {block.title}
              </h3>
              <p className="font-sans text-[15px] md:text-base leading-relaxed text-charcoal/70">
                {block.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
