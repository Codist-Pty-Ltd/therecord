"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  isPeopleIndexStatus,
  PEOPLE_INDEX_STATUS_VALUES,
  type PeopleIndexFilterStatus,
} from "@/lib/people-index";

const STATUS_LABEL: Record<PeopleIndexFilterStatus | "all", string> = {
  all: "All",
  active: "Active",
  suspended: "Suspended",
  charged: "Charged",
  acquitted: "Acquitted",
};

const CHIP_ORDER: (PeopleIndexFilterStatus | "all")[] = [
  "all",
  ...PEOPLE_INDEX_STATUS_VALUES,
];

export default function FiltersBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [input, setInput] = useState(() => searchParams.get("search") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentSearch = searchParams.get("search") ?? "";
  const rawStatus = searchParams.get("status");
  const currentStatus = isPeopleIndexStatus(
    rawStatus === null ? undefined : rawStatus,
  )
    ? rawStatus
    : null;

  useEffect(() => {
    setInput(currentSearch);
  }, [currentSearch]);

  const pushParams = useCallback(
    (next: { search?: string; status?: string | null }) => {
      const q = new URLSearchParams(searchParams.toString());
      if (next.search !== undefined) {
        const t = next.search.trim();
        if (t) q.set("search", t);
        else q.delete("search");
      }
      if (next.status !== undefined) {
        if (next.status) q.set("status", next.status);
        else q.delete("status");
      }
      q.delete("page");
      const s = q.toString();
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const onInputChange = (v: string) => {
    setInput(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushParams({ search: v });
    }, 300);
  };

  const clearSearch = () => {
    setInput("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    pushParams({ search: "" });
  };

  return (
    <div className="mb-6 space-y-3">
      <div className="relative">
        <input
          type="search"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Search by name or role…"
          autoComplete="off"
          className="w-full min-h-[48px] rounded border border-charcoal/10 bg-white px-3 pr-10 text-sm text-charcoal shadow-sm placeholder:text-charcoal/40 focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
          aria-label="Search people"
        />
        {input ? (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded text-charcoal/50 hover:text-charcoal"
            aria-label="Clear search"
          >
            ×
          </button>
        ) : null}
      </div>

      <div className="flex w-full -mx-1 overflow-x-auto scrollbar-hidden pb-1">
        <div className="flex w-max min-w-full gap-2 px-1">
          {CHIP_ORDER.map((key) => {
            const isAll = key === "all";
            const active = isAll
              ? !currentStatus
              : currentStatus === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() =>
                  isAll
                    ? pushParams({ status: null })
                    : pushParams({ status: key })
                }
                className={[
                  "shrink-0 min-h-[40px] rounded border px-3 font-mono text-[10px] uppercase tracking-wider transition",
                  active
                    ? "border-amber text-amber bg-amber/5"
                    : "border-charcoal/12 text-charcoal/60 hover:border-charcoal/25 hover:text-charcoal/80",
                ].join(" ")}
              >
                {STATUS_LABEL[key]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
