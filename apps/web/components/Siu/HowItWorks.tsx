"use client";

/**
 * HowItWorks — three-step explainer for the SIU lifecycle, gated behind
 * a "What is the difference?" disclosure on mobile (open by default on
 * desktop where vertical real estate is cheap). When expanded the three
 * step cards animate in, then a connecting arrow strokes between them.
 *
 * Steps modelled on the editorial brief:
 *   1. Presidential Proclamation — the activation document.
 *   2. Forensic Investigation    — bank records, cellphones, witnesses.
 *   3. Three-Way Referral        — NPA, departments, Special Tribunal.
 *
 * The animation runs once when the section is first revealed; subsequent
 * collapse/expand cycles play through again so the reader sees the whole
 * sequence each time. Respects `prefers-reduced-motion`.
 */

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from "framer-motion";
import { useState } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

interface Step {
  index: number;
  icon: string;
  title: string;
  body: string;
  /** Tail bullet list — used by step 3 only, the three-way referral. */
  tail?: ReadonlyArray<{ label: string; trailing: string }>;
}

const STEPS: ReadonlyArray<Step> = [
  {
    index: 1,
    icon: "📜",
    title: "Presidential Proclamation",
    body: "The President signs a proclamation — a legal order — telling the SIU to investigate a specific matter. Each one carries a number like R23 of 2020, gazetted in the Government Gazette.",
  },
  {
    index: 2,
    icon: "🔍",
    title: "Forensic Investigation",
    body: "The SIU subpoenas bank records, cellphone records, and witnesses. It works like a financial detective agency — not police. No arrests, no prosecutions of its own.",
  },
  {
    index: 3,
    icon: "⚖️",
    title: "Three-Way Referral",
    body: "What they find goes three ways simultaneously:",
    tail: [
      { label: "Criminal evidence", trailing: "NPA — for prosecution" },
      { label: "Misconduct", trailing: "Department heads — for disciplinary action" },
      { label: "Contracts", trailing: "Special Tribunal — to cancel and recover money" },
    ],
  },
];

export default function HowItWorks() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const reduce = useReducedMotion() ?? false;

  return (
    <section
      aria-labelledby="siu-how-it-works-heading"
      className="bg-cream border-b border-charcoal/10"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          aria-controls="siu-how-it-works-panel"
          className={[
            "group flex items-center justify-between gap-4 w-full",
            "text-left -mx-2 px-2 py-2 rounded-lg",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/40",
          ].join(" ")}
        >
          <span className="flex flex-col gap-1.5">
            <span className="label-smallcaps text-amber">How it works</span>
            <span
              id="siu-how-it-works-heading"
              className="font-serif text-[24px] md:text-[34px] lg:text-[40px] leading-[1.15] tracking-[-0.01em] text-charcoal"
            >
              What is the difference?
            </span>
          </span>

          <motion.span
            aria-hidden
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: reduce ? 0 : 0.3, ease: EASE }}
            className="shrink-0 inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border border-charcoal/20 text-charcoal/70 group-hover:border-amber group-hover:text-amber transition-colors text-xl"
          >
            +
          </motion.span>
        </button>

        <p className="mt-3 max-w-2xl font-sans text-[14px] md:text-[15px] leading-relaxed text-charcoal/65">
          Commissions ask questions. The SIU follows the money. Three steps,
          one statutory body.
        </p>

        <AnimatePresence initial={false}>
          {isOpen ? (
            <motion.div
              id="siu-how-it-works-panel"
              key="panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                duration: reduce ? 0 : 0.45,
                ease: EASE,
              }}
              className="overflow-hidden"
            >
              <Flowchart reduce={reduce} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}

// =============================================================================
// Flowchart — three boxes connected by an animated arrow on desktop, vertical
// stack with arrow caps between rows on mobile.
// =============================================================================

function Flowchart({ reduce }: { reduce: boolean }) {
  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: reduce
        ? {}
        : { delayChildren: 0.12, staggerChildren: 0.18 },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 20 },
    visible: { opacity: 1, y: 0 },
  };

  const cardTransition: Transition = reduce
    ? { duration: 0 }
    : { duration: 0.5, ease: EASE };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mt-8 md:mt-12"
    >
      {/* Mobile + tablet — vertical stack with chevron connectors */}
      <ol className="flex flex-col gap-4 lg:hidden">
        {STEPS.map((step, idx) => (
          <li key={step.index} className="flex flex-col">
            <motion.div variants={cardVariants} transition={cardTransition}>
              <StepCard step={step} />
            </motion.div>
            {idx < STEPS.length - 1 ? (
              <motion.div
                aria-hidden
                variants={cardVariants}
                transition={cardTransition}
                className="self-center my-2 text-charcoal/30"
              >
                <DownArrow />
              </motion.div>
            ) : null}
          </li>
        ))}
      </ol>

      {/* Desktop — three-column layout with a stroked arrow drawing across */}
      <div className="hidden lg:block relative">
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: reduce ? 0 : 0.4,
            delay: reduce ? 0 : STEPS.length * 0.18 + 0.1,
          }}
          className="absolute inset-0 pointer-events-none"
        >
          <ConnectingArrow reduce={reduce} />
        </motion.div>

        <ol className="relative grid grid-cols-3 gap-8">
          {STEPS.map((step) => (
            <motion.li
              key={step.index}
              variants={cardVariants}
              transition={cardTransition}
              className="relative"
            >
              <StepCard step={step} />
            </motion.li>
          ))}
        </ol>
      </div>
    </motion.div>
  );
}

function StepCard({ step }: { step: Step }) {
  return (
    <article className="relative h-full bg-white rounded-xl md:rounded-2xl border border-charcoal/10 p-5 md:p-7 shadow-[0_1px_0_rgba(28,28,30,0.04)]">
      <div className="flex items-center gap-3 mb-3 md:mb-4">
        <span
          aria-hidden
          className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-amber/10 text-amber text-xl md:text-2xl"
        >
          {step.icon}
        </span>
        <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-charcoal/50">
          Step {step.index}
        </span>
      </div>

      <h3 className="font-serif text-[20px] md:text-[24px] leading-[1.2] text-charcoal">
        {step.title}
      </h3>

      <p className="mt-2 md:mt-3 font-sans text-[14px] md:text-[15px] leading-relaxed text-charcoal/75">
        {step.body}
      </p>

      {step.tail ? (
        <ul className="mt-4 flex flex-col gap-2.5">
          {step.tail.map((item) => (
            <li
              key={item.label}
              className="flex items-start gap-2 font-sans text-[13px] md:text-sm text-charcoal/80"
            >
              <span aria-hidden className="text-amber mt-0.5 select-none">
                →
              </span>
              <span>
                <span className="font-medium text-charcoal">{item.label}</span>
                <span className="text-charcoal/55">  ·  </span>
                <span>{item.trailing}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function DownArrow() {
  return (
    <svg
      width="24"
      height="28"
      viewBox="0 0 24 28"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 0v22M4 16l8 8 8-8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Desktop connecting arrow — strokes from the trailing edge of the first
// card, through the middle card, to the leading edge of the third card.
// Drawn with `pathLength` so framer-motion can animate the stroke from 0
// to 1 left-to-right.
function ConnectingArrow({ reduce }: { reduce: boolean }) {
  return (
    <svg
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      viewBox="0 0 1000 100"
      className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-12 text-amber"
      aria-hidden="true"
    >
      <motion.path
        d="M40 50 Q 250 18, 500 50 T 960 50"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="6 6"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.6 }}
        transition={{
          duration: reduce ? 0 : 1.0,
          ease: EASE,
        }}
      />
      <motion.polygon
        points="950,40 970,50 950,60"
        fill="currentColor"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 0.85, scale: 1 }}
        transition={{
          duration: reduce ? 0 : 0.3,
          delay: reduce ? 0 : 1.0,
          ease: EASE,
        }}
        style={{ transformOrigin: "960px 50px" }}
      />
    </svg>
  );
}
