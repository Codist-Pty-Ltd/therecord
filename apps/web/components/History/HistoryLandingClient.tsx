"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import type {
  HistoricalEraDetailApi,
  HistoryCompareApi,
} from "@the-record/shared-types";

import type { PlainEnglishLevel } from "@/components/ui/PlainEnglishBox";

const LEVELS: { id: PlainEnglishLevel; icon: string; label: string }[] = [
  { id: "child", icon: "🧒", label: "Child" },
  { id: "layperson", icon: "💬", label: "Plain" },
  { id: "legal", icon: "§", label: "Constitution" },
];

function eraAccent(slug: string): { border: string; dot: string; chip: string } {
  switch (slug) {
    case "pre-colonial":
      return {
        border: "border-[#D4A017]/50",
        dot: "bg-[#D4A017]",
        chip: "text-[#D4A017]",
      };
    case "colonial":
      return {
        border: "border-[#C8651B]/50",
        dot: "bg-[#C8651B]",
        chip: "text-[#C8651B]",
      };
    case "union-and-segregation":
      return {
        border: "border-orange-700/45",
        dot: "bg-orange-700",
        chip: "text-orange-800",
      };
    case "apartheid":
      return {
        border: "border-charge-red/45",
        dot: "bg-charge-red",
        chip: "text-charge-red",
      };
    case "post-apartheid":
      return {
        border: "border-[#16A34A]/50",
        dot: "bg-[#16A34A]",
        chip: "text-[#15803d]",
      };
    default:
      return {
        border: "border-charcoal/15",
        dot: "bg-charcoal/50",
        chip: "text-charcoal",
      };
  }
}

function pickEraText(era: HistoricalEraDetailApi, level: PlainEnglishLevel): string {
  switch (level) {
    case "layperson":
      return era.plain_english_layperson;
    case "legal":
      return era.plain_english_legal;
    default:
      return era.plain_english_child;
  }
}

export default function HistoryLandingClient({
  eras,
  compare,
  initialLevel,
}: {
  eras: HistoricalEraDetailApi[];
  compare: HistoryCompareApi | null;
  initialLevel: PlainEnglishLevel;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      router.replace(`/history?${q.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div className="bg-charcoal text-cream min-h-screen">
      <header className="border-b border-cream/10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16">
          <p className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.28em] text-amber mb-4">
            The Record · South African history
          </p>
          <h1 className="font-serif text-[26px] md:text-[36px] leading-tight text-cream max-w-3xl">
            Before the headlines.
            <br />
            The history that makes them.
          </h1>
          <p className="mt-4 max-w-2xl font-sans text-sm md:text-[15px] leading-relaxed text-cream/70">
            To understand what is happening in South Africa today, you need to
            understand what happened before. The land. The laws. The people. The
            economy.
          </p>

          <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Reading level">
            {LEVELS.map((L) => (
              <button
                key={L.id}
                type="button"
                onClick={() => setLevel(L.id)}
                className={[
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors",
                  level === L.id
                    ? "bg-amber text-charcoal"
                    : "bg-cream/10 text-cream/80 hover:bg-cream/15",
                ].join(" ")}
              >
                <span aria-hidden>{L.icon}</span>
                {L.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-14">
        <div className="relative">
          <div
            aria-hidden
            className="hidden md:block absolute left-[19px] top-6 bottom-6 w-px bg-cream/15"
          />
          <ul className="flex flex-col gap-8 md:gap-10">
            {eras.map((era) => {
              const accent = eraAccent(era.slug);
              const preview = pickEraText(era, level);
              const highlights = era.events.slice(0, 3);
              return (
                <li key={era.id} className="relative md:pl-12">
                  <span
                    aria-hidden
                    className={[
                      "hidden md:block absolute left-[11px] top-8 h-4 w-4 rounded-full border-2 border-cream",
                      accent.dot,
                    ].join(" ")}
                  />
                  <article
                    className={[
                      "rounded-2xl border bg-cream/5 p-5 md:p-7 backdrop-blur-sm",
                      accent.border,
                    ].join(" ")}
                  >
                    <div className="flex flex-wrap items-start gap-3">
                      <span aria-hidden className="text-2xl md:text-3xl">
                        {era.icon ?? "•"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={[
                            "font-mono text-[10px] uppercase tracking-[0.22em]",
                            accent.chip,
                          ].join(" ")}
                        >
                          {era.period}
                        </p>
                        <h2 className="font-serif text-xl md:text-2xl text-cream mt-1">
                          <Link
                            href={`/history/${encodeURIComponent(era.slug)}`}
                            className="hover:text-amber transition-colors"
                          >
                            {era.name}
                          </Link>
                        </h2>
                        {era.key_theme ? (
                          <p className="mt-2 text-sm italic text-cream/60">
                            {era.key_theme}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <p className="mt-4 text-sm md:text-[15px] leading-relaxed text-cream/80 line-clamp-6 md:line-clamp-none">
                      {preview}
                    </p>

                    {highlights.length > 0 ? (
                      <ul className="mt-4 space-y-1.5 text-sm text-cream/75">
                        {highlights.map((e) => (
                          <li key={e.id} className="flex gap-2">
                            <span aria-hidden className="text-amber">
                              →
                            </span>
                            <span>{e.title}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    <Link
                      href={`/history/${encodeURIComponent(era.slug)}`}
                      className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-amber hover:text-cream"
                    >
                      Explore this era →
                    </Link>
                  </article>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {compare ? (
        <section className="border-t border-cream/10 bg-cream/[0.04]">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16">
            <h2 className="font-serif text-xl md:text-2xl text-cream mb-2">
              Before, during, and after
            </h2>
            <p className="text-sm text-cream/65 mb-8 max-w-3xl">
              Measured honestly: some gaps narrowed after 1994; many inherited
              structures remain. Every headline figure should be verified against
              the latest official release.
            </p>

            <div className="grid md:grid-cols-3 gap-8 md:gap-6">
              <CompareColumn
                title="Before (1994)"
                rows={[
                  `Land reserves: about ${compare.land_black_apartheid} of SA for the majority under segregation law`,
                  `Income gap (early 1970s): ${compare.income_gap_apartheid} (white:black, per capita — WID estimates)`,
                  "Vote: whites-only national elections in the apartheid era",
                  "Education: vast per-pupil spending gap (10× band widely cited for peak apartheid)",
                ]}
                sourceKeys={["land_black_apartheid", "income_gap_apartheid"]}
                sources={compare.sources}
              />
              <CompareColumn
                title="The law changed"
                rows={[
                  "27 April 1994 — first democratic election",
                  "10 December 1996 — Constitution signed",
                  "TRC final report — 29 October 1998",
                ]}
                sourceKeys={[]}
                sources={compare.sources}
              />
              <CompareColumn
                title="After (recent)"
                rows={[
                  `Land redistributed (c. 2018 headline): ${compare.land_redistributed_post} — targets missed; update with DALRRD where available`,
                  `Income gap (2019): ${compare.income_gap_post} — improved vs 1970s, still extreme`,
                  `Unemployment (expanded): ${compare.unemployment_post} — verify latest Stats SA`,
                  `Poverty (lower bound line): ${compare.poverty_post} — verify latest Stats SA`,
                ]}
                sourceKeys={[
                  "land_redistributed_post",
                  "income_gap_post",
                  "unemployment_post",
                  "poverty_post",
                ]}
                sources={compare.sources}
              />
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function CompareColumn({
  title,
  rows,
  sourceKeys,
  sources,
}: {
  title: string;
  rows: string[];
  sourceKeys: string[];
  sources: Record<string, string>;
}) {
  return (
    <div>
      <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber mb-4">
        {title}
      </h3>
      <ul className="space-y-3 text-sm text-cream/85">
        {rows.map((r) => (
          <li key={r} className="leading-snug">
            {r}
          </li>
        ))}
      </ul>
      {sourceKeys.length > 0 ? (
        <div className="mt-4 space-y-2 text-[10px] italic text-cream/45 leading-relaxed">
          {sourceKeys.map((k) =>
            sources[k] ? (
              <p key={k}>
                <span className="font-mono uppercase tracking-wider not-italic">{k}: </span>
                {sources[k]}
              </p>
            ) : null,
          )}
        </div>
      ) : null}
    </div>
  );
}
