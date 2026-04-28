"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";
import { useMemo } from "react";

import PlainEnglishBox, {
  type PlainEnglishLevel,
} from "@/components/ui/PlainEnglishBox";

import type { AdhocCommitteeDetail } from "@the-record/shared-types";

function childExcerpt(plain: string, mandate: string): string {
  const base = (plain || mandate).trim();
  if (!base) return "";
  const cutAt = 260;
  if (base.length <= cutAt) return base;
  const space = base.lastIndexOf(" ", cutAt);
  return (space > 40 ? base.slice(0, space) : base.slice(0, cutAt)) + "…";
}

interface AdhocPlainEnglishStackProps {
  committee: AdhocCommitteeDetail;
}

const STACK: { level: PlainEnglishLevel; label: string; pick: (c: AdhocCommitteeDetail) => string }[] = [
  {
    level: "child",
    label: "Explain like I'm 10",
    pick: (c) => childExcerpt(c.plain_english_summary, c.mandate_summary),
  },
  {
    level: "layperson",
    label: "In plain English",
    pick: (c) => (c.plain_english_summary || c.mandate_summary).trim(),
  },
  {
    level: "legal",
    label: "Legal framing",
    pick: (c) => c.mandate_summary.trim(),
  },
];

export default function AdhocPlainEnglishStack({
  committee,
}: AdhocPlainEnglishStackProps) {
  const reduce = useReducedMotion() ?? false;
  const items = useMemo(
    () => STACK.map((row) => ({ ...row, text: row.pick(committee) })),
    [committee],
  );

  if (!items.some((i) => i.text.length)) return null;

  return (
    <section
      aria-label="Plain English explanations"
      className="relative pl-1 md:pl-2 border-l-4 border-constitutional-gold rounded-r-2xl md:rounded-r-3xl py-1 space-y-4 md:space-y-5 max-w-4xl"
    >
      {items.map((row, i) => {
        if (!row.text.trim()) return null;
        return (
          <motion.div
            key={row.level}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: reduce ? 0 : 0.06 * i,
              duration: reduce ? 0.001 : 0.35,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <PlainEnglishBox
              level={row.level}
              text={row.text}
              label={row.label}
              collapsible={false}
            />
          </motion.div>
        );
      })}
    </section>
  );
}
