import Link from "next/link";

import type { ImpactWebSectorNode } from "@the-record/shared-types";

export default function ImpactExplorerGrid({ sectors }: { sectors: ImpactWebSectorNode[] }) {
  const ordered = [...sectors].sort((a, b) => a.slug.localeCompare(b.slug));
  if (ordered.length === 0) {
    return (
      <p className="py-6 text-sm text-charcoal/55">
        Impact sector data is not available yet.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {ordered.map((s) => (
        <li key={s.slug}>
          <Link
            href={`/impact#sector-${s.slug}`}
            className="flex h-full flex-col rounded-xl border border-charcoal/10 bg-cream p-3 transition hover:border-amber/35 hover:bg-amber/[0.04] md:p-4"
          >
            <span className="text-xl" aria-hidden>
              {s.icon ?? "◆"}
            </span>
            <span className="mt-2 font-serif text-[15px] leading-tight text-charcoal md:text-base">
              {s.name}
            </span>
            {s.stat_value ? (
              <span className="mt-2 font-serif text-xl tabular-nums text-amber md:text-2xl">
                {s.stat_value}
              </span>
            ) : null}
            <span className="mt-1 line-clamp-3 text-xs leading-snug text-charcoal/60">
              {s.stat_label ?? "See how corruption reaches ordinary lives."}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
