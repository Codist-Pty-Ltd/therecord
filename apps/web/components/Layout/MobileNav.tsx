"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { useFocusTrap } from "@/hooks/useFocusTrap";

import { MOBILE_NAV_SECTIONS, type NavItem } from "./nav-config";

export interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

const LEGAL_LINKS: ReadonlyArray<{
  readonly href: string;
  readonly label: string;
}> = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
  { href: "/editorial", label: "Editorial Standards" },
  { href: "/takedown", label: "Content Removal" },
];

const drawerVariants: Variants = {
  hidden: { x: "100%" },
  visible: { x: 0 },
};

const EASE_OUT_EDITORIAL = [0.22, 1, 0.36, 1] as const;

const sectionListVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04 },
  },
};

const sectionItemVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
};

const legalListVariants: Variants = {
  hidden: {},
  visible: {
    transition: { delayChildren: 0.12, staggerChildren: 0.05 },
  },
};

const legalItemVariants: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0 },
};

export default function MobileNav({ open, onClose }: MobileNavProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

  const sectionListActive: Variants = shouldReduceMotion
    ? {
        hidden: {},
        visible: { transition: { staggerChildren: 0 } },
      }
    : sectionListVariants;
  const sectionItemActive: Variants = shouldReduceMotion
    ? {
        hidden: { opacity: 1, x: 0 },
        visible: { opacity: 1, x: 0 },
      }
    : sectionItemVariants;
  const legalListActive: Variants = shouldReduceMotion
    ? { hidden: {}, visible: { transition: { staggerChildren: 0 } } }
    : legalListVariants;
  const legalItemActive: Variants = shouldReduceMotion
    ? { hidden: { opacity: 1, x: 0 }, visible: { opacity: 1, x: 0 } }
    : legalItemVariants;

  useEffect(() => {
    if (!open) return;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent): void {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const drawerTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.32, ease: EASE_OUT_EDITORIAL };

  const itemTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.35, ease: EASE_OUT_EDITORIAL };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="mobile-nav"
          id="mobile-nav"
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={drawerVariants}
          transition={drawerTransition}
          className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-charcoal"
        >
          <div className="flex h-14 shrink-0 items-center justify-end px-4 md:h-16 md:px-8">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 inline-flex h-12 w-12 items-center justify-center rounded-sm text-cream transition-colors hover:text-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="flex-1 px-6 pb-8 pt-4 md:px-10 md:pb-10 md:pt-6">
            {MOBILE_NAV_SECTIONS.map((section) => (
              <motion.nav
                key={section.sectionId}
                aria-label={section.title}
                className="mb-8 last:mb-4"
                initial="hidden"
                animate="visible"
                variants={sectionListActive}
              >
                <p className="mb-2 px-1 font-mono text-[10px] uppercase tracking-[0.1em] text-cream/45">
                  {section.title}
                </p>
                <ul className="flex flex-col gap-0">
                  {section.items.map((item) => (
                    <motion.li
                      key={item.href}
                      variants={sectionItemActive}
                      transition={itemTransition}
                    >
                      <MobileNavItem item={item} onNavigate={onClose} />
                    </motion.li>
                  ))}
                </ul>
              </motion.nav>
            ))}

            <motion.nav
              aria-label="Legal and policies"
              initial="hidden"
              animate="visible"
              variants={legalListActive}
              className="border-t border-white/[0.08] pt-8"
            >
              <p className="font-mono text-[10px] tracking-[0.2em] text-amber/90 mb-4 uppercase">
                Legal
              </p>
              <ul className="flex flex-col gap-3">
                {LEGAL_LINKS.map((link) => (
                  <motion.li
                    key={link.href}
                    variants={legalItemActive}
                    transition={itemTransition}
                  >
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className="inline-block rounded-md px-2 py-1 font-sans text-[15px] text-cream/75 transition-colors hover:bg-white/5 hover:text-amber focus-visible:outline-none focus-visible:text-amber"
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.nav>
          </div>

          <div className="shrink-0 px-6 pb-10 md:px-10 md:pb-12">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-amber">
              therecord.co.za
            </span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function MobileNavItem({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className="flex min-h-[48px] items-start gap-3 rounded-md px-2 py-[11px] transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/50"
    >
      <span
        className="w-5 shrink-0 text-center text-[15px] leading-none"
        aria-hidden
      >
        {item.icon}
      </span>
      <span className="min-w-0">
        <span className="block font-sans text-sm leading-[1.2] text-cream">
          {item.name}
        </span>
        <span className="mt-0.5 block font-sans text-[11px] leading-snug text-cream/50">
          {item.desc}
        </span>
      </span>
    </Link>
  );
}

function CloseIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <line x1="2" y1="2" x2="20" y2="20" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
      <line x1="20" y1="2" x2="2" y2="20" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
    </svg>
  );
}
