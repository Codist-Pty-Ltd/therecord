"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useMemo } from "react";

import DomainsStrip from "@/components/Home/DomainsStrip";

interface HeroProps {
  /** Slug of the currently-featured story, used for the primary CTA. */
  featuredSlug: string;
}

const HEADLINE_LINES: readonly string[] = [
  "The full story.",
  "Not just the headline.",
];

const SUBHEADING =
  "Track South African news from incident to verdict. Every charge explained. Every law linked.";

export default function Hero({ featuredSlug }: HeroProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <section className="relative bg-charcoal text-cream overflow-hidden">
      {/* Ambient amber glow behind the headline — subtle, desktop-only. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 hidden lg:block"
        style={{
          backgroundImage:
            "radial-gradient(70% 50% at 20% 20%, rgba(200,101,27,0.25), transparent 60%)",
        }}
      />

      <div className="relative w-full max-w-6xl mx-auto px-4 md:px-8 pt-14 md:pt-24 lg:pt-28 pb-12 md:pb-20 lg:pb-24 flex flex-col gap-8 md:gap-10">
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0.001 : 0.6,
            delay: shouldReduceMotion ? 0 : 0.1,
            ease: "easeOut",
          }}
          className="label-smallcaps text-amber"
        >
          The Record · Johannesburg
        </motion.p>

        {/* Headline — per-word stagger */}
        <h1 className="font-serif text-[36px] leading-[1.04] md:text-6xl lg:text-[64px] xl:text-[72px] tracking-[-0.015em] text-cream max-w-4xl">
          <WordStagger
            lines={HEADLINE_LINES}
            wordDelayStep={0.05}
            startDelay={0.2}
            shouldReduceMotion={shouldReduceMotion}
          />
        </h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0.001 : 0.6,
            delay: shouldReduceMotion ? 0 : 0.7,
            ease: "easeOut",
          }}
          className="max-w-2xl font-sans text-base md:text-lg leading-relaxed text-cream/70"
        >
          {SUBHEADING}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0.001 : 0.6,
            delay: shouldReduceMotion ? 0 : 0.85,
            ease: "easeOut",
          }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4"
        >
          <Link
            href={`/story/${featuredSlug}`}
            className="group inline-flex items-center justify-center gap-2 bg-amber text-charcoal rounded-full px-6 py-3.5 font-mono text-[11px] md:text-xs uppercase tracking-[0.18em] font-medium hover:bg-cream transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-amber/40"
          >
            Read the Mkhwanazi Case
            <span
              aria-hidden
              className="transition-transform group-hover:translate-x-0.5"
            >
              →
            </span>
          </Link>

          <Link
            href="/about"
            className="inline-flex items-center justify-center gap-2 bg-transparent text-cream rounded-full px-6 py-3.5 font-mono text-[11px] md:text-xs uppercase tracking-[0.18em] border border-cream/25 hover:border-amber hover:text-amber transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/40"
          >
            What is this?
          </Link>
        </motion.div>

        {/* Domain tags */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0.001 : 0.6,
            delay: shouldReduceMotion ? 0 : 1.0,
            ease: "easeOut",
          }}
          className="mt-2 md:mt-4"
        >
          <p className="label-smallcaps text-cream/40 mb-3 md:mb-4">
            Tracking five beats
          </p>
          <DomainsStrip variant="dark" scrollable />
        </motion.div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// WordStagger — splits multiple lines into words, animates each word with
// individual delay so the headline "reads in" left-to-right, line-by-line.
// -----------------------------------------------------------------------------

interface WordStaggerProps {
  lines: readonly string[];
  wordDelayStep: number;
  startDelay: number;
  shouldReduceMotion: boolean;
}

function WordStagger({
  lines,
  wordDelayStep,
  startDelay,
  shouldReduceMotion,
}: WordStaggerProps) {
  // Precompute a flat (line, wordInLine, globalIdx) structure so each word
  // gets a deterministic delay based on its overall position.
  const rows = useMemo(() => {
    let globalIdx = 0;
    return lines.map((line) => {
      const words = line.split(" ").filter(Boolean);
      return words.map((word) => ({ word, globalIdx: globalIdx++ }));
    });
  }, [lines]);

  return (
    <span className="inline">
      {rows.map((row, lineIdx) => (
        <span key={lineIdx} className="block overflow-hidden pb-1 md:pb-2">
          {row.map(({ word, globalIdx }, i) => (
            <motion.span
              key={globalIdx}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : "0.6em" }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0.001 : 0.7,
                delay: shouldReduceMotion
                  ? 0
                  : startDelay + globalIdx * wordDelayStep,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="inline-block"
            >
              {word}
              {i < row.length - 1 ? "\u00a0" : ""}
            </motion.span>
          ))}
        </span>
      ))}
    </span>
  );
}
