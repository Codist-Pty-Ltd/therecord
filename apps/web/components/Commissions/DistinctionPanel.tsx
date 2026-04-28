"use client";

/**
 * DistinctionPanel — explainer block on /commissions that names the
 * constitutional difference between commissions of inquiry (executive,
 * Section 84(2)(f)) and parliamentary ad hoc committees (legislative,
 * NA Rule 253).
 *
 * Layout:
 *   • Desktop (md+): two columns, always expanded.
 *   • Mobile: collapsed by default behind a "What's the difference?"
 *     toggle so the eye lands on the tab bar without a wall of text. The
 *     toggle is `display: none` on desktop so it never interferes there.
 *
 * Animation: Framer Motion height animation on mobile only — desktop
 * always renders the full panel and skips the AnimatePresence path so we
 * don't ship an empty animation frame.
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

export default function DistinctionPanel() {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion() ?? false;

  return (
    <section
      aria-labelledby="distinction-heading"
      className="bg-cream border-b border-charcoal/10"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-12">
        {/* Mobile-only toggle — hidden from md upward. */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="distinction-body"
          className={[
            "md:hidden",
            "w-full flex items-center justify-between gap-4 py-1",
            "font-mono text-[11px] uppercase tracking-[0.18em] text-charcoal/70",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/40 rounded",
          ].join(" ")}
        >
          <span className="inline-flex items-center gap-2">
            <span className="text-amber">i</span>
            What&rsquo;s the difference?
          </span>
          <span
            aria-hidden
            className={`text-charcoal/45 transition-transform ${open ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        </button>

        {/* Desktop heading. */}
        <h2
          id="distinction-heading"
          className="hidden md:block label-smallcaps text-amber"
        >
          The Distinction
        </h2>

        {/* Body — always rendered on md+, animated on mobile only. */}
        <div className="hidden md:block">
          <DistinctionBody />
        </div>

        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              key="mobile-distinction"
              id="distinction-body"
              initial={
                reduced ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }
              }
              animate={{ opacity: 1, height: "auto" }}
              exit={
                reduced ? { opacity: 0, height: 0 } : { opacity: 0, height: 0 }
              }
              transition={{ duration: reduced ? 0.001 : 0.25, ease: "easeOut" }}
              className="md:hidden overflow-hidden"
            >
              <DistinctionBody />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}

// =============================================================================
// Body — shared between desktop (always shown) and mobile (collapsible)
// =============================================================================

function DistinctionBody() {
  return (
    <div className="mt-4 md:mt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        <Pillar
          tag="Executive"
          tagClass="text-legal-blue"
          title="Commissions of Inquiry"
          lines={[
            "Created by the President under Section 84(2)(f) of the Constitution.",
            "Operates independently of Parliament.",
            "Chaired by a retired judge.",
            "Cannot prosecute — makes recommendations to the NPA.",
          ]}
        />
        <Pillar
          tag="Legislature"
          tagClass="text-amber"
          title="Ad Hoc Parliamentary Committees"
          lines={[
            "Created by the National Assembly under Rule 253.",
            "Sits within Parliament — the Legislature, not the Executive.",
            "Chaired by an MP (usually from the ruling party).",
            "Cannot prosecute — reports to the National Assembly.",
          ]}
        />
      </div>

      <div className="mt-6 md:mt-8 pt-5 md:pt-6 border-t border-amber/30">
        <p className="font-serif italic text-[14px] md:text-[16px] leading-[1.5] text-amber max-w-3xl">
          Both can investigate the same matter simultaneously. This happened with
          the Mkhwanazi allegations — creating a unique constitutional moment
          where both branches of government investigated in parallel.
        </p>
        <Link
          href="/story/mkhwanazi-madlanga-commission"
          className="mt-3 inline-flex items-center gap-1.5 font-mono text-[11px] md:text-xs uppercase tracking-[0.18em] text-amber hover:text-amber/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/40 rounded"
        >
          See the Mkhwanazi story
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      </div>
    </div>
  );
}

interface PillarProps {
  tag: string;
  tagClass: string;
  title: string;
  lines: string[];
}

function Pillar({ tag, tagClass, title, lines }: PillarProps) {
  return (
    <div>
      <p
        className={`label-smallcaps ${tagClass} mb-2`}
        // The colour-coding mirrors the row badges: blue = executive
        // (legal-blue), amber = legislature.
      >
        {tag}
      </p>
      <h3 className="font-serif text-[20px] md:text-[24px] leading-[1.2] text-charcoal mb-3 md:mb-4">
        {title}
      </h3>
      <ul className="flex flex-col gap-2 font-sans text-[14px] md:text-[15px] leading-[1.55] text-charcoal/75">
        {lines.map((line) => (
          <li key={line} className="flex gap-2">
            <span aria-hidden className="text-amber/60 leading-tight">
              •
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
