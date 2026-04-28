"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import type { LegalReference } from "@the-record/shared-types";

/**
 * LegalPanel — indented, border-left panel listing `LegalReference`s.
 *
 * Default accent is slate-blue (statutory / non-constitutional). Pass the
 * `variant="constitutional"` prop (or use <ConstitutionPanel />) to switch to
 * the constitutional-gold accent.
 *
 * Each row exposes a "Plain English" toggle when `plain_english` is present
 * on the reference. Collapsed by default (mobile-first).
 */

export type LegalPanelVariant = "statutory" | "constitutional";

interface LegalPanelProps {
  title: string;
  references: LegalReference[];
  variant?: LegalPanelVariant;
  className?: string;
}

interface Accent {
  border: string;
  text: string;
  ringBg: string;
}

const ACCENTS: Record<LegalPanelVariant, Accent> = {
  statutory: {
    border: "border-l-legal-blue",
    text: "text-legal-blue",
    ringBg: "bg-legal-blue/5",
  },
  constitutional: {
    border: "border-l-constitutional-gold",
    text: "text-constitutional-gold",
    ringBg: "bg-constitutional-gold/5",
  },
};

export default function LegalPanel({
  title,
  references,
  variant = "statutory",
  className,
}: LegalPanelProps) {
  if (references.length === 0) return null;

  const accent = ACCENTS[variant];

  return (
    <aside
      className={[
        "border-l-4 rounded-r-lg",
        "bg-white/70 backdrop-blur-sm",
        "pl-4 md:pl-6 pr-4 md:pr-6 py-4 md:py-5",
        "shadow-[0_1px_0_rgba(28,28,30,0.04)]",
        accent.border,
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={title}
    >
      <h3
        className={[
          "font-mono uppercase tracking-[0.2em] text-[10px] md:text-xs",
          "mb-3 md:mb-4",
          accent.text,
        ].join(" ")}
      >
        {title}
      </h3>

      <ul className="flex flex-col gap-4 md:gap-5">
        {references.map((reference, idx) => (
          <LegalReferenceRow
            key={`${reference.short_name}-${reference.section}-${idx}`}
            reference={reference}
            accentText={accent.text}
            accentRing={accent.ringBg}
          />
        ))}
      </ul>
    </aside>
  );
}

// ---------------------------------------------------------------- row

interface LegalReferenceRowProps {
  reference: LegalReference;
  accentText: string;
  accentRing: string;
}

function LegalReferenceRow({
  reference,
  accentText,
  accentRing,
}: LegalReferenceRowProps) {
  const [open, setOpen] = useState(false);
  const hasPlain = Boolean(reference.plain_english);

  return (
    <li className="font-sans">
      <div className="flex flex-col gap-1">
        <p className="font-serif text-base md:text-lg leading-snug text-charcoal">
          {reference.act_name}
          {reference.act_number ? (
            <span className="font-mono text-xs md:text-sm text-charcoal/55 ml-2">
              ({reference.act_number})
            </span>
          ) : null}
        </p>

        <p
          className={[
            "font-mono text-xs md:text-sm tracking-wide",
            accentText,
          ].join(" ")}
        >
          {reference.short_name} · § {reference.section}
        </p>

        <p className="text-sm md:text-base leading-relaxed text-charcoal/80 mt-1">
          {reference.relevance}
        </p>
      </div>

      {hasPlain ? (
        <div className="mt-2 md:mt-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex items-center gap-1.5 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-amber hover:underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/50 rounded"
          >
            <span aria-hidden>{open ? "−" : "+"}</span>
            {open ? "Hide plain English" : "Plain English"}
          </button>

          <AnimatePresence initial={false}>
            {open ? (
              <motion.div
                key="plain"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <p
                  className={[
                    "mt-2 md:mt-3 p-3 md:p-4 rounded-md",
                    "text-sm md:text-base leading-relaxed text-charcoal/85",
                    "border border-charcoal/5",
                    accentRing,
                  ].join(" ")}
                >
                  {reference.plain_english}
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      ) : null}
    </li>
  );
}
