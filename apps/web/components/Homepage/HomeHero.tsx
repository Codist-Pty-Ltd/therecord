"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const wordStagger = 0.04;

export default function HomeHero() {
  const line1 = ["The", "full", "story."];
  const line2Before = ["Not", "just", "the"];

  return (
    <section className="relative overflow-hidden bg-charcoal text-cream">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full border border-amber/[0.07]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-56 w-56 rounded-full border border-amber/[0.05]"
        aria-hidden
      />
      <div className="relative z-[1] max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-24">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber"
        >
          South Africa · Accountability Intelligence
        </motion.p>

        <h1
          className="mt-6 font-serif text-[clamp(32px,7vw,56px)] leading-[1.08] text-cream"
          style={{ fontFeatureSettings: '"liga" 1' }}
        >
          <span className="block">
            {line1.map((w, i) => (
              <motion.span
                key={w + i}
                className="inline-block mr-[0.25em]"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * wordStagger, duration: 0.45 }}
              >
                {w}
              </motion.span>
            ))}
          </span>
          <span className="mt-1 block">
            {line2Before.map((w, i) => (
              <motion.span
                key={w + i}
                className="inline-block mr-[0.25em]"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (line1.length + i) * wordStagger, duration: 0.45 }}
              >
                {w}
              </motion.span>
            ))}
            <motion.span
              className="inline-block font-serif italic text-amber"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (line1.length + line2Before.length) * wordStagger, duration: 0.45 }}
            >
              headline
            </motion.span>
            <motion.span
              className="inline-block"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: (line1.length + line2Before.length + 1) * wordStagger,
                duration: 0.45,
              }}
            >
              .
            </motion.span>
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-5 max-w-[440px] font-sans text-sm leading-[1.55] text-cream/60"
        >
          Track South African stories from incident to verdict. Every commission.
          Every charge. Every law explained in plain language.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.45 }}
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <Link
            href="/story/mkhwanazi-madlanga-commission"
            className="inline-flex min-h-[44px] items-center justify-center rounded border border-amber bg-amber px-6 text-sm font-medium text-cream transition hover:bg-amber/90"
          >
            Read the Mkhwanazi Case →
          </Link>
          <Link
            href="/about"
            className="inline-flex min-h-[44px] items-center justify-center rounded border border-cream/20 bg-transparent px-6 text-sm font-medium text-cream/90 transition hover:border-cream/40"
          >
            What is this?
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
