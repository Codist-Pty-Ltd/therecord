"use client";

import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";

import { getPersonInitials, getStatusColour } from "@/lib/format";

import type { PersonSummary } from "@the-record/shared-types";

export interface PeopleStripRow {
  person: PersonSummary;
  role: string;
}

export interface PeopleStripProps {
  rows: PeopleStripRow[];
}

function textOnAvatar(status: string): string {
  if (status === "suspended") return "text-charcoal";
  return "text-cream";
}

/** Row order is controlled upstream (e.g. Babita first); not re-sorted here. */
export default function PeopleStrip({ rows }: PeopleStripProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  if (rows.length === 0) {
    return null;
  }

  return (
    <section
      id="people-anchor"
      className="bg-charcoal border-t border-white/[0.06] text-cream"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10">
        <div className="flex items-center justify-end">
          <Link
            href="/people"
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber/90 hover:text-amber"
          >
            See all people →
          </Link>
        </div>
        <div
          ref={ref}
          className="mt-4 -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hidden md:mx-0 md:px-0"
        >
          {rows.map((row, i) => {
            const bg = getStatusColour(row.person.status);
            const tc = textOnAvatar(row.person.status);
            const surname = row.person.full_name.split(/\s+/).pop() ?? row.person.full_name;
            return (
              <motion.div
                key={row.person.id}
                initial={false}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                transition={{ delay: i * 0.06, duration: 0.25 }}
                className="w-[110px] flex-shrink-0"
              >
                <Link
                  href={`/person/${row.person.id}`}
                  className="flex min-h-[44px] flex-col items-center gap-1.5 py-1 text-center"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full text-[11px] font-medium ${tc}`}
                    style={{ backgroundColor: bg }}
                  >
                    {getPersonInitials(row.person.full_name)}
                  </div>
                  <p className="w-full font-sans text-[11px] font-medium leading-tight line-clamp-2">
                    {surname}
                  </p>
                  <p className="w-full font-mono text-[9px] text-cream/45 line-clamp-2">
                    {row.role}
                  </p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
