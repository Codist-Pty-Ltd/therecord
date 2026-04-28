import Link from "next/link";

const SECTIONS: {
  n: string;
  num: string;
  title: string;
  body: string;
  href: string;
}[] = [
  {
    n: "§205",
    num: "205",
    title: "Policing",
    body: "The national police are under civilian control, through the Minister, but must be structured to function in the national interest — a guarantee of professional independence from factional meddling.",
    href: "/constitution/205",
  },
  {
    n: "§179",
    num: "179",
    title: "The National Prosecuting Authority",
    body: "The NPA must exercise its functions without fear, favour or prejudice — a constitutional anchor for prosecutorial independence when political pressure runs hot.",
    href: "/constitution/179",
  },
  {
    n: "§84(2)(f)",
    num: "84",
    title: "Presidential powers (commissions of inquiry)",
    body: "The President may authorise a commission of inquiry, one of the levers that turns a cloud of allegations into a public, evidence-based record.",
    href: "/constitution/84",
  },
];

export default function ConstitutionSpotlight() {
  return (
    <section className="bg-cream border-t border-charcoal/10">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-14">
        <div className="mb-6">
          <h2 className="font-serif text-[22px] text-charcoal">The Constitution</h2>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-charcoal/45">
            Most cited sections
          </p>
        </div>
        <ul className="space-y-3">
          {SECTIONS.map((s) => (
            <li key={s.num}>
              <Link
                href={s.href}
                className="flex gap-4 rounded-md border border-transparent p-3 transition hover:bg-[#FFFDF5] min-h-[44px] items-start"
              >
                <div
                  className="w-1 shrink-0 self-stretch rounded-sm"
                  style={{ backgroundColor: "#D4A017" }}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="font-mono text-[20px] text-[#D4A017] font-normal tracking-tight">
                    {s.n}
                  </p>
                  <p className="text-[13px] font-medium text-charcoal">{s.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-charcoal/60">
                    {s.body}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
