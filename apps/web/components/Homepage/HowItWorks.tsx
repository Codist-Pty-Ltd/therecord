const CARDS: { icon: string; title: string; body: string }[] = [
  {
    icon: "📰",
    title: "We track news as it happens",
    body:
      "Articles are ingested, clustered into story threads, and linked to the events that preceded them — automatically.",
  },
  {
    icon: "⚖️",
    title: "Every charge maps to a law",
    body:
      "When someone is charged with corruption, we show you exactly which section of PRECCA applies — and what it means.",
  },
  {
    icon: "🧒",
    title: "Three levels of explanation",
    body:
      "Every legal concept is explained for a child, a layperson, and a lawyer. Switch between them with one tap.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-cream">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-14">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {CARDS.map((c) => (
            <div
              key={c.title}
              className="rounded-md border border-charcoal/10 bg-white p-4 shadow-sm"
            >
              <p className="text-xl" aria-hidden>
                {c.icon}
              </p>
              <h3 className="mt-2 font-sans text-sm font-semibold text-charcoal">
                {c.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-charcoal/70">
                {c.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
