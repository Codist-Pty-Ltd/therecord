"use client";

import { motion } from "framer-motion";

const SLUG = "adhoc-mkhwebane-section194-2022";

export default function AdhocHistoricBanner({ slug }: { slug: string }) {
  if (slug !== SLUG) return null;

  return (
    <motion.aside
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Historic significance"
      className="mb-6 md:mb-8 rounded-2xl border-l-4 border-constitutional-gold bg-constitutional-gold/10 px-5 md:px-7 py-4 md:py-5 max-w-4xl"
    >
      <p className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-constitutional-gold mb-2">
        Historic
      </p>
      <p className="font-sans text-sm md:text-base text-charcoal/90 leading-relaxed">
        First time in South African history a Chapter 9 institution head was
        removed through the constitutional mechanism.
      </p>
    </motion.aside>
  );
}
