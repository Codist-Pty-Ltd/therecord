"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

/**
 * PlainEnglishBox — collapsible panel rendering a plain-English explanation.
 *
 *   level="child"      🧒  cream background, amber accent, larger serif body
 *   level="layperson"  💬  white background, slate-blue accent, lean body
 *   level="legal"      §   formal body, charcoal border (for statutory framing)
 *
 * Collapsed by default (mobile-first). Pass `collapsible={false}` for
 * directory pages (e.g. ad hoc committees) where all three levels stay
 * visible without a toggle.
 */

export type PlainEnglishLevel = "child" | "layperson" | "legal";

interface PlainEnglishBoxProps {
  text: string;
  level: PlainEnglishLevel;
  /** Start expanded. Defaults to `false`, matching the mobile-first spec. */
  defaultOpen?: boolean;
  className?: string;
  /** Override the default header label. */
  label?: string;
  /**
   * When false, header and body are always shown; no collapse control.
   * Use for solemn institutional pages with a three-level stack.
   */
  collapsible?: boolean;
}

interface LevelStyle {
  icon: string;
  defaultLabel: string;
  container: string;
  iconWrap: string;
  body: string;
  toggle: string;
}

const TOGGLE_ARIA: Record<PlainEnglishLevel, string> = {
  child: "Explain at child level",
  layperson: "Explain in plain language",
  legal: "Legal framing",
};

const LEVELS: Record<PlainEnglishLevel, LevelStyle> = {
  child: {
    icon: "🧒",
    defaultLabel: "Explain like I'm 10",
    container: "bg-cream border border-amber/30 rounded-xl md:rounded-2xl",
    iconWrap: "bg-amber/15 text-amber",
    body: "font-serif text-base md:text-lg leading-relaxed text-charcoal",
    toggle: "text-amber",
  },
  layperson: {
    icon: "💬",
    defaultLabel: "In plain English",
    container: "bg-white border border-charcoal/10 rounded-xl md:rounded-2xl",
    iconWrap: "bg-legal-blue/10 text-legal-blue",
    body: "font-sans text-sm md:text-base leading-relaxed text-charcoal/85",
    toggle: "text-legal-blue",
  },
  legal: {
    icon: "§",
    defaultLabel: "Legal framing",
    container: "bg-charcoal/[0.02] border border-charcoal/12 rounded-xl md:rounded-2xl",
    iconWrap: "bg-charcoal/10 text-charcoal",
    body: "font-sans text-sm md:text-[15px] leading-relaxed text-charcoal/90",
    toggle: "text-charcoal/60",
  },
};

export default function PlainEnglishBox({
  text,
  level,
  defaultOpen = false,
  className,
  label,
  collapsible = true,
}: PlainEnglishBoxProps) {
  const [open, setOpen] = useState(defaultOpen);
  const reduce = useReducedMotion() ?? false;
  const style = LEVELS[level];

  if (!collapsible) {
    return (
      <div
        className={[
          "shadow-sm",
          style.container,
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="flex items-center gap-3 px-4 md:px-5 py-3 md:py-4 border-b border-charcoal/5">
          <span
            aria-hidden
            className={[
              "inline-flex items-center justify-center shrink-0",
              "h-8 w-8 md:h-9 md:w-9 rounded-full text-lg md:text-xl",
              style.iconWrap,
            ].join(" ")}
          >
            {style.icon}
          </span>
          <span className="flex-1 font-mono uppercase tracking-[0.18em] text-[10px] md:text-[11px] text-charcoal/75">
            {label ?? style.defaultLabel}
          </span>
        </div>
        <p className={["px-4 md:px-5 pb-4 md:pb-5 pt-1", style.body].join(" ")}>
          {text}
        </p>
      </div>
    );
  }

  return (
    <div
      className={[
        "shadow-sm",
        style.container,
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={TOGGLE_ARIA[level]}
        className="w-full flex items-center gap-3 px-4 md:px-5 py-3 md:py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/50 rounded-xl md:rounded-2xl"
      >
        <span
          aria-hidden
          className={[
            "inline-flex items-center justify-center shrink-0",
            "h-8 w-8 md:h-9 md:w-9 rounded-full text-lg md:text-xl",
            style.iconWrap,
          ].join(" ")}
        >
          {style.icon}
        </span>

        <span className="flex-1 font-mono uppercase tracking-[0.18em] text-[10px] md:text-[11px] text-charcoal/75">
          {label ?? style.defaultLabel}
        </span>

        <span
          aria-hidden
          className={[
            "font-mono text-sm leading-none select-none",
            style.toggle,
          ].join(" ")}
        >
          {open ? "−" : "+"}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="content"
            initial={reduce ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { height: "auto", opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0.001 : 0.3, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <p className={["px-4 md:px-5 pb-4 md:pb-5", style.body].join(" ")}>
              {text}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
