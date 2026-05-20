"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import type { HistoricalEraDetailApi } from "@the-record/shared-types";

import HistoryTimeline from "@/components/History/HistoryTimeline";
import PlainEnglishBox, {
  type PlainEnglishLevel,
} from "@/components/ui/PlainEnglishBox";

const LEVELS: { id: PlainEnglishLevel; icon: string; label: string }[] = [
  { id: "child", icon: "🧒", label: "Child" },
  { id: "layperson", icon: "💬", label: "Plain" },
  { id: "legal", icon: "§", label: "Constitution" },
];

function eraAccent(slug: string): string {
  switch (slug) {
    case "pre-colonial":
      return "text-[#D4A017]";
    case "colonial":
      return "text-[#C8651B]";
    case "union-and-segregation":
      return "text-orange-700";
    case "apartheid":
      return "text-charge-red";
    case "post-apartheid":
      return "text-[#16A34A]";
    default:
      return "text-amber";
  }
}

export default function HistoryEraDetailClient({
  era,
  initialLevel,
}: {
  era: HistoricalEraDetailApi;
  initialLevel: PlainEnglishLevel;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accent = eraAccent(era.slug);
  const levelParam = searchParams.get("level");
  const level = useMemo((): PlainEnglishLevel => {
    if (levelParam === "layperson" || levelParam === "legal" || levelParam === "child") {
      return levelParam;
    }
    return initialLevel;
  }, [levelParam, initialLevel]);

  const setLevel = useCallback(
    (next: PlainEnglishLevel) => {
      const q = new URLSearchParams(searchParams.toString());
      q.set("level", next);
      router.replace(`/history/${encodeURIComponent(era.slug)}?${q.toString()}`, {
        scroll: false,
      });
    },
    [router, searchParams, era.slug],
  );

  const foundational = era.laws.filter((l) => l.is_foundational);
  const rest = era.laws.filter((l) => !l.is_foundational);
  const [showAllLaws, setShowAllLaws] = useState(false);

  return (
    <article className="bg-cream min-h-screen">
      <div className="border-b border-charcoal/10 bg-charcoal text-cream">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 text-sm">
          <nav
            aria-label="Breadcrumb"
            className="font-mono text-[10px] uppercase tracking-wider text-cream/60"
          >
            <Link href="/" className="hover:text-amber">
              Home
            </Link>
            <span className="mx-2">→</span>
            <Link href="/history" className="hover:text-amber">
              History
            </Link>
            <span className="mx-2">→</span>
            <span className="text-cream">{era.name}</span>
          </nav>
        </div>
      </div>

      <header className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-14">
        <p className={`font-mono text-[10px] uppercase tracking-[0.25em] ${accent}`}>
          <span aria-hidden>{era.icon ?? ""}</span> {era.period}
        </p>
        <h1 className="font-serif text-[28px] md:text-[34px] text-charcoal mt-2">
          {era.name}
        </h1>
        {era.key_theme ? (
          <p className="mt-3 text-sm italic text-charcoal/65">{era.key_theme}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          {LEVELS.map((L) => (
            <button
              key={L.id}
              type="button"
              onClick={() => setLevel(L.id)}
              className={[
                "inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors border",
                level === L.id
                  ? "bg-charcoal text-cream border-charcoal"
                  : "bg-white text-charcoal/80 border-charcoal/15 hover:border-amber/50",
              ].join(" ")}
            >
              <span aria-hidden>{L.icon}</span>
              {L.label}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:gap-5">
          <PlainEnglishBox level="child" text={era.plain_english_child} collapsible={false} />
          <PlainEnglishBox
            level="layperson"
            text={era.plain_english_layperson}
            collapsible={false}
          />
          <PlainEnglishBox level="legal" text={era.plain_english_legal} collapsible={false} />
        </div>
      </header>

      <section className="border-t border-charcoal/10 py-6 md:py-10 bg-white">
        <h2 className="font-serif text-2xl text-charcoal text-center mb-2">Timeline</h2>
        <p className="text-center text-sm text-charcoal/60 max-w-2xl mx-auto px-4 mb-8">
          Sourced events — open a card for detail and citations.
        </p>
        <HistoryTimeline
          events={era.events}
          anchorSlug={era.slug}
          plainEnglishLevel={level}
        />
      </section>

      {era.laws.length > 0 ? (
        <section className="max-w-6xl mx-auto px-4 md:px-8 py-12 border-t border-charcoal/10">
          <h2 className="font-serif text-2xl text-charcoal mb-6">Laws in this era</h2>
          <ul className="flex flex-col gap-6">
            {foundational.map((law) => (
              <li key={law.id}>
                <LawCard law={law} prominent plainEnglishLevel={level} />
              </li>
            ))}
            {showAllLaws
              ? rest.map((law) => (
                  <li key={law.id}>
                    <LawCard law={law} prominent={false} plainEnglishLevel={level} />
                  </li>
                ))
              : null}
          </ul>
          {rest.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowAllLaws((v) => !v)}
              className="mt-6 font-mono text-[11px] uppercase tracking-wider text-legal-blue hover:text-amber"
            >
              {showAllLaws ? "Show fewer laws" : `Show all ${rest.length} more laws`}
            </button>
          ) : null}
        </section>
      ) : null}

      {era.statistics.length > 0 ? (
        <section className="bg-charcoal/[0.02] border-t border-charcoal/10 py-12">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <h2 className="font-serif text-2xl text-charcoal mb-8">Statistics</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {era.statistics.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm"
                >
                  <p className="font-serif text-2xl md:text-3xl text-amber">{s.value}</p>
                  <p className="mt-2 font-medium text-charcoal">{s.label}</p>
                  <p className="mt-2 text-sm text-charcoal/75 leading-relaxed">
                    {s.value_context}
                  </p>
                  <p className="mt-3 text-[10px] font-mono uppercase tracking-wider text-charcoal/45">
                    {s.source}
                    {s.year_or_period ? ` · ${s.year_or_period}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <CrossLinksSection eraSlug={era.slug} />
    </article>
  );
}

function LawCard({
  law,
  prominent,
  plainEnglishLevel,
}: {
  law: HistoricalEraDetailApi["laws"][number];
  prominent: boolean;
  plainEnglishLevel: PlainEnglishLevel;
}) {
  const pe =
    plainEnglishLevel === "layperson"
      ? law.plain_english_layperson
      : plainEnglishLevel === "legal"
        ? law.what_it_did
        : law.plain_english_child;

  return (
    <div
      className={[
        "rounded-2xl border p-5 md:p-6",
        prominent
          ? "border-amber/40 bg-amber/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
          : "border-charcoal/10 bg-white",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-mono text-[11px] text-charcoal/50">{law.year_enacted}</span>
        <h3 className="font-serif text-lg text-charcoal">{law.name}</h3>
        <span className="font-mono text-[10px] uppercase tracking-wider text-charcoal/45">
          {law.category.replace(/_/g, " ")}
        </span>
      </div>
      {law.year_repealed ? (
        <p className="text-xs text-charcoal/55 mt-1">Repealed {law.year_repealed}</p>
      ) : (
        <p className="text-xs text-charcoal/55 mt-1">Status: {law.status}</p>
      )}
      <p className="mt-3 text-sm leading-relaxed text-charcoal/85">{law.what_it_did}</p>
      <div className="mt-4">
        <PlainEnglishBox level={plainEnglishLevel} text={pe} collapsible />
      </div>
      {law.constitutional_violation ? (
        <div className="mt-4 rounded-xl border border-legal-blue/25 bg-legal-blue/[0.06] p-4 text-sm text-charcoal/90">
          <p className="font-mono text-[10px] uppercase tracking-wider text-legal-blue mb-1">
            Against today&apos;s Constitution
          </p>
          {law.constitutional_violation}
        </div>
      ) : null}
      {law.impact_summary ? (
        <p className="mt-3 text-sm text-charcoal/80">{law.impact_summary}</p>
      ) : null}
      {law.replaced_by ? (
        <p className="mt-2 text-xs text-charcoal/55">
          Superseded / replaced by: {law.replaced_by} — see current Acts index on{" "}
          <Link href="/laws" className="text-legal-blue hover:underline">
            /laws
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}

function CrossLinksSection({ eraSlug }: { eraSlug: string }) {
  if (eraSlug !== "apartheid" && eraSlug !== "post-apartheid") return null;

  return (
    <section className="max-w-6xl mx-auto px-4 md:px-8 py-12 border-t border-charcoal/10">
      <h2 className="font-serif text-xl text-charcoal mb-4">On The Record today</h2>
      {eraSlug === "apartheid" ? (
        <ul className="space-y-3 text-sm text-charcoal/85">
          <li>
            <Link
              href="/commissions/truth-reconciliation-commission-trc"
              className="text-legal-blue hover:text-amber"
            >
              Truth and Reconciliation Commission archive
            </Link>{" "}
            — hearings, reports, and accountability threads.
          </li>
          <li>
            <Link
              href="/commissions/trc-prosecutions-inquiry-2025"
              className="text-legal-blue hover:text-amber"
            >
              TRC Prosecutions Inquiry (2025)
            </Link>{" "}
            — stalled prosecutions after amnesty denials.
          </li>
          <li>
            <Link href="/transformation" className="text-legal-blue hover:text-amber">
              B-BBEE &amp; transformation explainer
            </Link>{" "}
            — economic response to apartheid&apos;s legacy.
          </li>
        </ul>
      ) : (
        <ul className="space-y-3 text-sm text-charcoal/85">
          <li>
            <Link href="/commissions" className="text-legal-blue hover:text-amber">
              Commissions index
            </Link>{" "}
            — most accountability work on this site is post-1994.
          </li>
          <li>
            <Link href="/stories" className="text-legal-blue hover:text-amber">
              Live investigations &amp; timelines
            </Link>
            .
          </li>
        </ul>
      )}
    </section>
  );
}
