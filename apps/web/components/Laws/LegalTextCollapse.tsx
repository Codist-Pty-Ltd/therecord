"use client";

/**
 * Collapsible block that shows the section's full legal text in monospace.
 * Sits beneath the {@link PlainEnglishPanel} so readers who want the formal
 * wording can expand it without losing their place.
 *
 * If `fullText` is null we render nothing — the page should not show a
 * collapse button that opens an empty pane.
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

interface LegalTextCollapseProps {
  fullText: string | null;
}

export default function LegalTextCollapse({ fullText }: LegalTextCollapseProps) {
  const reduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);

  if (!fullText || fullText.trim().length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Full legal text"
      className="rounded-2xl border border-charcoal/10 bg-charcoal/[0.025] overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-4 px-5 md:px-7 py-4 md:py-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-inset"
      >
        <div className="flex flex-col">
          <span className="label-smallcaps text-charcoal/55">
            Full text of the section
          </span>
          <span className="font-mono text-[11px] md:text-[12px] text-charcoal/45 mt-1">
            As enacted. {isOpen ? "Click to collapse." : "Click to expand."}
          </span>
        </div>

        <span
          aria-hidden
          className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full border border-charcoal/15 text-charcoal/55"
        >
          <motion.svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            aria-hidden
          >
            <path
              d="M3 5l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            key="legal-text"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
            animate={
              reduceMotion ? { opacity: 1 } : { opacity: 1, height: "auto" }
            }
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.32,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="overflow-hidden"
          >
            <div className="px-5 md:px-7 pb-6 md:pb-7 pt-1">
              <pre className="font-mono text-[12.5px] md:text-[13.5px] leading-[1.7] text-charcoal/80 whitespace-pre-wrap break-words">
                {fullText}
              </pre>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
