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

/**
 * Full-screen navigation drawer that slides in from the right on mobile.
 * Controlled by the parent (`Header`) via `open` / `onClose`.
 *
 * Behaviour:
 *  - Slide-in / slide-out via `AnimatePresence` (x: 100% → 0).
 *  - Nav items stagger in after the drawer finishes sliding.
 *  - Body scroll is locked while the drawer is mounted.
 *  - Escape closes the drawer.
 *  - Focus moves to the close button when the drawer opens.
 *  - Tapping any link closes the drawer before navigation.
 *  - Respects `prefers-reduced-motion` — animations collapse to instant.
 */
export interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

const NAV_LINKS: ReadonlyArray<{
  readonly href: string;
  readonly label: string;
}> = [
  { href: "/stories", label: "Stories" },
  { href: "/commissions", label: "Commissions" },
  { href: "/siu", label: "SIU" },
  { href: "/laws", label: "Laws & Constitution" },
  { href: "/people", label: "People" },
  { href: "/about", label: "About" },
  { href: "/domains", label: "Domains" },
];

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

const listVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      // Let the drawer finish sliding before items begin staggering.
      delayChildren: 0.18,
      staggerChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0 },
};

// Editorial ease — a slightly-overshot cubic that lands firmly at rest.
const EASE_OUT_EDITORIAL = [0.22, 1, 0.36, 1] as const;

export default function MobileNav({ open, onClose }: MobileNavProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

  // Lock body scroll while the drawer is open. We restore the previous
  // value on unmount rather than force-set to `""` so we don't fight any
  // other global scroll-lock source.
  useEffect(() => {
    if (!open) return;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Close on Escape. Only bound while the drawer is open so we don't stomp
  // other keydown handlers across the app.
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
    : { duration: 0.4, ease: EASE_OUT_EDITORIAL };

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
          className="fixed inset-0 z-[100] bg-charcoal flex flex-col overflow-y-auto"
        >
          {/* Close bar — mirrors the header's height so the X sits where
              the hamburger was. Gives the user an unmistakable visual cue
              that the drawer replaced (not added to) the header. */}
          <div className="flex items-center justify-end px-4 md:px-8 h-14 md:h-16 shrink-0">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-12 h-12 -mr-2 inline-flex items-center justify-center text-cream hover:text-amber transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60 rounded-sm"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Nav list — staggered entrance */}
          <motion.nav
            aria-label="Site navigation"
            className="flex-1 px-6 md:px-10 pt-8 md:pt-16 pb-10"
            variants={shouldReduceMotion ? undefined : listVariants}
            initial="hidden"
            animate="visible"
          >
            <ul className="flex flex-col gap-5 md:gap-7">
              {NAV_LINKS.map((link) => (
                <motion.li
                  key={link.href}
                  variants={shouldReduceMotion ? undefined : itemVariants}
                  transition={itemTransition}
                >
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className="inline-block font-serif text-[32px] md:text-[40px] leading-[1.1] text-cream hover:text-amber transition-colors focus-visible:outline-none focus-visible:text-amber"
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.nav>

          <motion.nav
            aria-label="Legal and policies"
            className="px-6 md:px-10 pb-8 shrink-0"
            variants={shouldReduceMotion ? undefined : listVariants}
            initial="hidden"
            animate="visible"
          >
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-amber/90 mb-4">
              Legal
            </p>
            <ul className="flex flex-col gap-3">
              {LEGAL_LINKS.map((link) => (
                <motion.li
                  key={link.href}
                  variants={shouldReduceMotion ? undefined : itemVariants}
                  transition={itemTransition}
                >
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className="inline-block font-sans text-[15px] text-cream/75 hover:text-amber transition-colors focus-visible:outline-none focus-visible:text-amber"
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.nav>

          {/* Footer — domain wordmark. Sits at the bottom, pushed down by
              the `flex-1` on <motion.nav> above. */}
          <div className="px-6 md:px-10 pb-10 md:pb-12 shrink-0">
            <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-amber">
              therecord.co.za
            </span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
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
