import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  AdhocRowList,
  CommissionsRowList,
  SiuProclamationsRowList,
} from "@/components/Accountability/ExplorerRowLists";
import DomainStoryRowList from "@/components/Domain/DomainStoryRowList";
import {
  listAdhocCommittees,
  listCommissions,
  listSiuProclamations,
  listStories,
} from "@/lib/api";
import EmptyState from "@/components/ui/EmptyState";
import {
  commissionToStoryListDomain,
  domainPageTitleLabel,
  domainSlugToCommission,
  isValidDomainPageSlug,
} from "@/lib/domain-routes";
import type { StorySummary } from "@the-record/shared-types";

interface DomainPageProps {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({
  params,
}: DomainPageProps): Promise<Metadata> {
  const { name } = await params;
  if (!isValidDomainPageSlug(name)) {
    return { title: "Not found | The Record" };
  }
  const domainLabel = domainPageTitleLabel(name);
  const description = `All South African commissions, investigations, and stories in the ${domainLabel} domain.`;
  const canonical = `https://therecord.codist.co.za/domain/${name}`;

  return {
    title: `${domainLabel} | The Record`,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: "The Record",
      locale: "en_ZA",
      title: domainLabel,
      description,
      url: canonical,
    },
  };
}

export default async function DomainPage({ params }: DomainPageProps) {
  const { name } = await params;

  if (!isValidDomainPageSlug(name)) {
    notFound();
  }

  const apiDomain = domainSlugToCommission(name);
  if (!apiDomain) {
    notFound();
  }

  const storyDomain = commissionToStoryListDomain(apiDomain);

  const emptyStories = {
    data: [] as StorySummary[],
    meta: { page: 1, limit: 10, total: 0, total_pages: 0 },
  };

  const [commRes, adhocRes, siuRes, storyRes] = await Promise.all([
    listCommissions(1, 20, { domain: apiDomain }),
    listAdhocCommittees(1, 10, { domain: apiDomain }),
    listSiuProclamations(1, 10, { domain: apiDomain }),
    storyDomain
      ? listStories(1, 10, { domain: storyDomain })
      : Promise.resolve(emptyStories),
  ]);

  const cRows = commRes.data;
  const aRows = adhocRes.data;
  const sRows = siuRes.data;
  const tRows = storyRes.data;

  const nComm = cRows.length;
  const nAdhoc = aRows.length;
  const nSiu = sRows.length;
  const nStories = tRows.length;
  const total = nComm + nAdhoc + nSiu + nStories;

  const label = domainPageTitleLabel(name);

  if (total === 0) {
    return (
      <div className="bg-cream min-h-[50vh]">
        <EmptyState
          icon="🏛️"
          heading={`Nothing in ${label} just yet`}
          body="This domain has no stories, commissions, or investigations listed for now. As coverage grows, new records will show up here."
          action={{ label: "← Browse all commissions", href: "/commissions" }}
        />
      </div>
    );
  }

  return (
    <div className="bg-cream pb-16 md:pb-24">
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-10">
        <nav
          aria-label="Breadcrumb"
          className="font-sans text-[12px] text-charcoal/50"
        >
          <ol className="flex flex-wrap items-center gap-x-1.5">
            <li>
              <Link
                href="/"
                className="hover:text-amber transition-colors"
              >
                Home
              </Link>
            </li>
            <li aria-hidden className="text-charcoal/30">›</li>
            <li className="text-charcoal/70" aria-current="page">
              {label}
            </li>
          </ol>
        </nav>

        <h1 className="mt-4 md:mt-6 font-serif text-[32px] md:text-[40px] leading-tight text-charcoal tracking-[-0.01em]">
          {label}
        </h1>
        <p className="mt-3 max-w-2xl font-sans text-sm md:text-base text-charcoal/65 leading-relaxed">
          All commissions, investigations, and stories in this domain.
        </p>

        <div className="mt-6 md:mt-8 flex flex-wrap gap-6 md:gap-10 border-y border-charcoal/10 py-4 md:py-5">
          <p className="font-mono text-xs md:text-sm uppercase tracking-[0.12em] text-charcoal/70">
            <span className="text-charcoal font-semibold tabular-nums text-base md:text-lg">
              {nComm}
            </span>{" "}
            Commissions
          </p>
          <p className="font-mono text-xs md:text-sm uppercase tracking-[0.12em] text-charcoal/70">
            <span className="text-charcoal font-semibold tabular-nums text-base md:text-lg">
              {nSiu + nAdhoc}
            </span>{" "}
            Investigations
          </p>
          <p className="font-mono text-xs md:text-sm uppercase tracking-[0.12em] text-charcoal/70">
            <span className="text-charcoal font-semibold tabular-nums text-base md:text-lg">
              {nStories}
            </span>{" "}
            Stories
          </p>
        </div>
      </div>

      {nComm > 0 ? (
        <section
          className="max-w-6xl mx-auto px-4 md:px-8 pt-10 md:pt-14"
          aria-label="Commissions of inquiry in this domain"
        >
          <h2 className="label-smallcaps text-charcoal/55 mb-4 md:mb-5">
            Commissions of inquiry
          </h2>
          <CommissionsRowList rows={cRows} />
        </section>
      ) : null}

      {nAdhoc > 0 ? (
        <section
          className="max-w-6xl mx-auto px-4 md:px-8 pt-10 md:pt-12"
          aria-label="Parliamentary committees in this domain"
        >
          <h2 className="label-smallcaps text-charcoal/55 mb-4 md:mb-5">
            Parliamentary committees
          </h2>
          <AdhocRowList rows={aRows} />
        </section>
      ) : null}

      {nSiu > 0 ? (
        <section
          className="max-w-6xl mx-auto px-4 md:px-8 pt-10 md:pt-12"
          aria-label="SIU investigations in this domain"
        >
          <h2 className="label-smallcaps text-charcoal/55 mb-4 md:mb-5">
            SIU investigations
          </h2>
          <SiuProclamationsRowList rows={sRows} />
        </section>
      ) : null}

      {nStories > 0 ? (
        <section
          className="max-w-6xl mx-auto px-4 md:px-8 pt-10 md:pt-12"
          aria-label="Stories in this domain"
        >
          <h2 className="label-smallcaps text-charcoal/55 mb-4 md:mb-5">
            Stories
          </h2>
          <DomainStoryRowList stories={tRows} />
        </section>
      ) : null}
    </div>
  );
}
