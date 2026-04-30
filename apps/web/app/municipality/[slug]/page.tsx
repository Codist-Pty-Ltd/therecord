import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import AccountabilityStoryRow from "@/components/Accountability/AccountabilityStoryRow";
import { MunicipalityMoneyPanel } from "@/components/Provinces/ProvinceMoneyPanel";
import { getMunicipality } from "@/lib/api";
import { agAuditChipClass, agAuditLabel } from "@/lib/ag-audit-ui";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

function governingPartyPresentation(party: string | null): {
  label: string;
  chipClass: string;
} {
  if (!party) {
    return {
      label: "Governing party unknown",
      chipClass: "border-charcoal/15 bg-charcoal/5 text-charcoal/65",
    };
  }
  const u = party.toUpperCase();
  if (u.includes("COALITION") || u.includes("/")) {
    return {
      label: party,
      chipClass: "border-amber/40 bg-amber/12 text-amber",
    };
  }
  if (u.includes("DA")) {
    return {
      label: party,
      chipClass: "border-legal-blue/35 bg-legal-blue/10 text-legal-blue",
    };
  }
  if (u.includes("ANC")) {
    return {
      label: party,
      chipClass: "border-timeline-green/35 bg-timeline-green/10 text-timeline-green",
    };
  }
  return {
    label: party,
    chipClass: "border-charcoal/15 bg-cream text-charcoal/80",
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const m = await getMunicipality(slug);

  if (!m) {
    return {
      title: "Municipality not found | The Record",
      robots: { index: false, follow: false },
    };
  }

  const title = `${m.name} | The Record`;
  const description = `Accountability stories and public money tracked for ${m.name}, ${m.province_name}.`;
  const canonical = `https://therecord.co.za/municipality/${m.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "The Record",
      type: "website",
    },
  };
}

export default async function MunicipalityPage({ params }: Props) {
  const { slug } = await params;
  const m = await getMunicipality(slug);

  if (!m) {
    notFound();
  }

  const party = governingPartyPresentation(m.governing_party);

  return (
    <div className="bg-cream pb-20 md:pb-28">
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-10">
        <nav
          aria-label="Breadcrumb"
          className="font-sans text-[12px] text-charcoal/50"
        >
          <ol className="flex flex-wrap items-center gap-x-1.5">
            <li>
              <Link href="/" className="hover:text-amber transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden className="text-charcoal/30">
              ›
            </li>
            <li>
              <Link href="/provinces" className="hover:text-amber transition-colors">
                Provinces
              </Link>
            </li>
            <li aria-hidden className="text-charcoal/30">
              ›
            </li>
            <li>
              <Link
                href={`/provinces/${m.province_slug}`}
                className="hover:text-amber transition-colors"
              >
                {m.province_name}
              </Link>
            </li>
            <li aria-hidden className="text-charcoal/30">
              ›
            </li>
            <li className="text-charcoal/70" aria-current="page">
              {m.name}
            </li>
          </ol>
        </nav>

        <div className="mt-6 flex flex-wrap items-baseline gap-2">
          <h1 className="font-serif text-[30px] md:text-[36px] leading-tight text-charcoal">
            {m.name}
          </h1>
          <span className="rounded border border-charcoal/15 bg-cream px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-charcoal/65">
            {m.municipality_type.replace("_", " ")}
          </span>
        </div>
        <p className="mt-2 font-sans text-sm text-charcoal/55">{m.province_name}</p>

        <div
          className="mt-8 rounded-2xl border border-charcoal/12 bg-cream p-5 md:p-7"
          aria-label="AG audit outcome"
        >
          {m.ag_audit_outcome ? (
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${agAuditChipClass(m.ag_audit_outcome)}`}
            >
              {agAuditLabel(m.ag_audit_outcome)}
            </span>
          ) : (
            <p className="font-mono text-xs text-charcoal/50">No AG outcome on file</p>
          )}
          {m.plain_english_audit_outcome ? (
            <p className="mt-4 text-sm leading-relaxed text-charcoal/75">
              {m.plain_english_audit_outcome}
            </p>
          ) : null}
        </div>

        <div className="mt-6">
          <span
            className={`inline-flex rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider ${party.chipClass}`}
          >
            {party.label}
          </span>
        </div>

        <section className="mt-12" aria-label="Stories in this municipality">
          <h2 className="label-smallcaps text-charcoal/55 mb-4">Accountability stories</h2>
          {m.stories.length === 0 ? (
            <p className="text-sm text-charcoal/55">No linked stories yet.</p>
          ) : (
            <ul className="divide-y divide-charcoal/10 border-t border-charcoal/10">
              {m.stories.map((s) => (
                <AccountabilityStoryRow key={s.id} story={s} />
              ))}
            </ul>
          )}
        </section>

        <div className="mt-12">
          <MunicipalityMoneyPanel
            name={m.name}
            totalRands={m.total_money_tracked_rands}
            expenditure_by_type={m.expenditure_by_type}
            expenditure_by_sector={m.expenditure_by_sector}
          />
        </div>

        <p className="mt-12">
          <Link
            href={`/provinces/${m.province_slug}`}
            className="font-mono text-sm text-amber hover:underline"
          >
            ← Back to {m.province_name}
          </Link>
        </p>
      </div>
    </div>
  );
}
