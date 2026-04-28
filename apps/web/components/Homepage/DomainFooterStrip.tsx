import Link from "next/link";

const CHIPS: { label: string; href: string }[] = [
  { label: "Criminal Justice", href: "/domain/criminal-justice" },
  { label: "Corruption", href: "/commissions" },
  { label: "Politics", href: "/domain/politics" },
  { label: "Public Safety", href: "/commissions" },
  { label: "Financial", href: "/commissions" },
  { label: "Human Rights", href: "/commissions" },
  { label: "Education", href: "/commissions" },
  { label: "Policing", href: "/commissions" },
];

export default function DomainFooterStrip() {
  return (
    <section className="bg-white border-t border-charcoal/10">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <div className="flex flex-wrap justify-center gap-2">
          {CHIPS.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="inline-flex min-h-[40px] items-center rounded border border-charcoal/15 px-2.5 font-mono text-[10px] uppercase tracking-wider text-charcoal/75 transition hover:border-amber hover:text-amber"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
