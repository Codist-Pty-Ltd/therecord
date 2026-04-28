"use client";

/**
 * The "Plain English ↔ Legal text" toggle that sits at the top of every
 * section page.
 *
 * The brief originally asked for THREE levels — child / adult / legal — but
 * `LawSection` only stores `plain_english` (child-level by editorial policy)
 * and an optional `full_text` (legal). Until a third copy variant is added
 * to the schema we ship a two-mode toggle and label the modes accordingly:
 *
 *   • Plain English  — `plain_english` (always available, default)
 *   • Legal text     — `full_text` (only when the API provides it)
 *
 * If `full_text` is missing the toggle gracefully collapses to the plain-
 * English view and the toggle button is hidden — readers should never see
 * a toggle that flips them to an empty pane.
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

type Mode = "plain" | "legal";

interface PlainEnglishPanelProps {
  plainEnglish: string;
  fullText: string | null;
}

export default function PlainEnglishPanel({
  plainEnglish,
  fullText,
}: PlainEnglishPanelProps) {
  const reduceMotion = useReducedMotion();
  const [mode, setMode] = useState<Mode>("plain");

  const hasLegal = Boolean(fullText && fullText.trim().length > 0);
  const activeMode: Mode = hasLegal ? mode : "plain";

  return (
    <section
      aria-label="Section explanation"
      className="rounded-2xl bg-amber/[0.05] border border-amber/15 px-5 md:px-8 py-6 md:py-8"
    >
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <ModeIcon mode={activeMode} />
          <div className="flex flex-col">
            <span className="label-smallcaps text-amber">
              {activeMode === "plain" ? "In plain English" : "In legal language"}
            </span>
            <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.15em] text-charcoal/50 mt-0.5">
              {activeMode === "plain"
                ? "Written so a child could follow it"
                : "The full text of the section"}
            </span>
          </div>
        </div>

        {hasLegal ? (
          <ModeToggle activeMode={activeMode} onChange={setMode} />
        ) : null}
      </header>

      <div className="mt-5 md:mt-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeMode}
            role="tabpanel"
            id={
              activeMode === "plain"
                ? "law-section-panel-plain"
                : "law-section-panel-legal"
            }
            aria-labelledby={
              activeMode === "plain"
                ? "law-section-tab-plain"
                : "law-section-tab-legal"
            }
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
            transition={{
              duration: reduceMotion ? 0 : 0.22,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            {activeMode === "plain" ? (
              <p className="font-serif text-[18px] md:text-[22px] leading-[1.55] text-charcoal whitespace-pre-line">
                {plainEnglish}
              </p>
            ) : (
              <p className="font-mono text-[13px] md:text-[14px] leading-[1.7] text-charcoal/85 whitespace-pre-line">
                {fullText}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {!hasLegal ? (
        <p className="mt-5 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.15em] text-charcoal/45">
          Full legal text is unavailable for this section in The Record.
        </p>
      ) : null}
    </section>
  );
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

function ModeIcon({ mode }: { mode: Mode }) {
  if (mode === "plain") {
    return (
      <span
        aria-hidden
        className="inline-flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full bg-amber/15 text-[20px] md:text-[22px]"
      >
        🧒
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full bg-charcoal/10 text-[18px] md:text-[20px]"
    >
      ⚖️
    </span>
  );
}

function ModeToggle({
  activeMode,
  onChange,
}: {
  activeMode: Mode;
  onChange: (mode: Mode) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Switch reading mode"
      className="inline-flex bg-charcoal/[0.06] border border-charcoal/10 rounded-full p-1 self-start"
    >
      <ToggleButton
        id="law-section-tab-plain"
        controls="law-section-panel-plain"
        isActive={activeMode === "plain"}
        onClick={() => onChange("plain")}
        label="Plain English"
        ariaLabel="Explain in plain language"
      />
      <ToggleButton
        id="law-section-tab-legal"
        controls="law-section-panel-legal"
        isActive={activeMode === "legal"}
        onClick={() => onChange("legal")}
        label="Legal text"
        ariaLabel="View full legal text"
      />
    </div>
  );
}

function ToggleButton({
  id,
  controls,
  isActive,
  onClick,
  label,
  ariaLabel,
}: {
  id: string;
  controls: string;
  isActive: boolean;
  onClick: () => void;
  label: string;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      id={id}
      role="tab"
      aria-selected={isActive}
      aria-controls={controls}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`relative font-mono text-[10px] md:text-[11px] uppercase tracking-[0.16em] px-3.5 md:px-4 py-1.5 md:py-2 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/50 ${
        isActive
          ? "bg-charcoal text-cream"
          : "text-charcoal/60 hover:text-charcoal"
      }`}
    >
      {label}
    </button>
  );
}
