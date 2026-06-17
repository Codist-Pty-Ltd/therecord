import type { Metadata } from "next";

import AskTheRecordForm from "@/components/Ask/AskTheRecordForm";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Ask The Record",
  description:
    "Ask grounded questions over The Record accountability corpus — stories, commissions, SIU proclamations, and people — with cited sources.",
  alternates: { canonical: `${SITE_URL}/ask` },
  robots: { index: true, follow: true },
};

export default function AskPage() {
  return (
    <div className="min-w-0 max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-charcoal/50 mb-3">
        Intelligence
      </p>
      <h1 className="font-serif text-2xl md:text-3xl text-charcoal tracking-tight">
        Ask The Record
      </h1>
      <p className="mt-4 font-sans text-base text-charcoal/75 leading-relaxed max-w-2xl">
        Questions are answered from indexed corpus material only — not live news.
        Each answer includes citations you can open on the site.
      </p>
      <div className="mt-8">
        <AskTheRecordForm />
      </div>
    </div>
  );
}
