"use client";

import { motion, useReducedMotion } from "framer-motion";

import { IMPACT_SECTOR_CHAIN_COLOR } from "@/lib/impact-display";

const CHAINS: { title: string; sectorKeys: string[]; steps: string[] }[] = [
  {
    title: "The Housing Chain",
    sectorKeys: ["housing", "jobs", "safety"],
    steps: [
      "Tender fraud",
      "House not built",
      "Family in shack",
      "No address",
      "Can't get bank account",
      "Can't get job",
      "Child grows up in poverty",
    ],
  },
  {
    title: "The Water Chain",
    sectorKeys: ["water", "health", "education"],
    steps: [
      "Water contract fraud",
      "Pipes not fixed",
      "No clean water",
      "Waterborne disease",
      "Child misses school",
      "Falls behind",
      "Drops out at Grade 10",
    ],
  },
  {
    title: "The Eskom Chain",
    sectorKeys: ["jobs", "housing", "education", "transport"],
    steps: [
      "State capture at Eskom",
      "Load-shedding",
      "Business closes",
      "Job lost",
      "Can't pay rent",
      "Eviction",
      "Child changes school",
      "Education disrupted",
    ],
  },
];

function ChainNode({
  text,
  colour,
  i,
  reduce,
  showArrow,
}: {
  text: string;
  colour: string;
  i: number;
  reduce: boolean;
  showArrow: boolean;
}) {
  return (
    <motion.div
      className="flex shrink-0 items-center gap-2"
      initial={reduce ? false : { opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: reduce ? 0 : 0.35, delay: reduce ? 0 : i * 0.05 }}
    >
      <span
        className="max-w-[140px] rounded-lg border px-2.5 py-2 font-sans text-[13px] leading-snug text-charcoal shadow-sm md:max-w-[180px]"
        style={{
          borderColor: `${colour}55`,
          backgroundColor: `${colour}14`,
        }}
      >
        {text}
      </span>
      {showArrow ? (
        <span className="font-mono text-amber/80" aria-hidden>
          →
        </span>
      ) : null}
    </motion.div>
  );
}

export default function ImpactInterconnectChains() {
  const reduce = useReducedMotion() ?? false;

  return (
    <section className="bg-cream py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <h2 className="font-serif text-[22px] text-charcoal md:text-[26px]">
          Nothing happens in isolation
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-charcoal/65">
          Corruption in one sector sets off dominoes in others. These chains are editorial
          summaries — each node is coloured by the civic-life lens it touches.
        </p>

        <div className="mt-10 flex flex-col gap-12">
          {CHAINS.map((chain) => (
            <div key={chain.title}>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber">
                {chain.title}
              </h3>
              <div className="mt-4 flex gap-0 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible md:pb-0">
                {chain.steps.map((step, i) => {
                  const sectorSlug = chain.sectorKeys[i % chain.sectorKeys.length];
                  const colour =
                    IMPACT_SECTOR_CHAIN_COLOR[sectorSlug] ?? IMPACT_SECTOR_CHAIN_COLOR.housing;
                  return (
                    <ChainNode
                      key={`${chain.title}-${i}`}
                      text={step}
                      colour={colour}
                      i={i}
                      reduce={reduce}
                      showArrow={i < chain.steps.length - 1}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
