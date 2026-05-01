"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { NAV_GROUPS, type NavItem } from "./nav-config";
import { HeaderSearchButton } from "./HeaderSearchButton";
import MobileNav from "./MobileNav";

const HOVER_CLOSE_MS = 100;
const DROPDOWN_EASE = [0.19, 1, 0.22, 1] as const;

export default function Header() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useReducedMotion() ?? false;

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current != null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpenGroupId(null);
      closeTimerRef.current = null;
    }, HOVER_CLOSE_MS);
  }, [clearCloseTimer]);

  const openGroup = useCallback(
    (id: string) => {
      clearCloseTimer();
      setOpenGroupId(id);
    },
    [clearCloseTimer],
  );

  useEffect(() => {
    return () => {
      if (closeTimerRef.current != null) clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!openGroupId) return;
    function onKey(event: KeyboardEvent): void {
      if (event.key === "Escape") setOpenGroupId(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openGroupId]);

  return (
    <>
      <header
        role="banner"
        className="fixed top-0 inset-x-0 z-50 bg-charcoal"
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 min-w-0 px-4 md:h-16 md:px-8">
          <Link
            href="/"
            aria-label="The Record — home"
            className="shrink-0 rounded-sm font-mono text-[14px] uppercase tracking-[0.22em] text-cream transition-colors hover:text-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60"
          >
            THE RECORD
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-end gap-2 lg:flex">
            <nav aria-label="Primary" className="flex items-center gap-1">
              {NAV_GROUPS.map((group) => (
                <div
                  key={group.id}
                  className="relative"
                  onMouseEnter={() => openGroup(group.id)}
                  onMouseLeave={scheduleClose}
                >
                  <button
                    type="button"
                    aria-expanded={openGroupId === group.id}
                    aria-haspopup="true"
                    aria-controls={`nav-panel-${group.id}`}
                    id={`nav-trigger-${group.id}`}
                    onClick={() =>
                      setOpenGroupId((v) => (v === group.id ? null : group.id))
                    }
                    className={[
                      "flex items-center gap-1 rounded px-3 py-2 font-sans text-[13px] transition-colors",
                      openGroupId === group.id
                        ? "bg-white/10 text-cream"
                        : "text-cream/70 hover:bg-white/5 hover:text-cream",
                    ].join(" ")}
                  >
                    {group.label}
                    <ChevronIcon open={openGroupId === group.id} />
                  </button>

                  <AnimatePresence>
                    {openGroupId === group.id ? (
                      <motion.div
                        key={group.id}
                        id={`nav-panel-${group.id}`}
                        role="region"
                        aria-labelledby={`nav-trigger-${group.id}`}
                        initial={
                          reduceMotion
                            ? { opacity: 1, y: 0 }
                            : { opacity: 0, y: -4 }
                        }
                        animate={{ opacity: 1, y: 0 }}
                        exit={
                          reduceMotion
                            ? { opacity: 1, y: 0 }
                            : { opacity: 0, y: -4 }
                        }
                        transition={{
                          duration: reduceMotion ? 0 : 0.15,
                          ease: DROPDOWN_EASE,
                        }}
                        className={[
                          "absolute top-[calc(100%+4px)] left-0 z-[100] overflow-hidden rounded-[10px] border border-charcoal/10 bg-cream shadow-[0_4px_20px_rgba(0,0,0,0.08)]",
                          group.columns === 2
                            ? "min-w-[min(100vw-2rem,440px)] p-2"
                            : "min-w-[200px] p-2",
                        ].join(" ")}
                        onMouseEnter={clearCloseTimer}
                        onMouseLeave={scheduleClose}
                      >
                        <div
                          className={
                            group.columns === 2
                              ? "grid grid-cols-2 gap-0.5 p-2"
                              : "flex flex-col gap-0.5 p-1"
                          }
                        >
                          {group.items.map((item) => (
                            <NavDropdownLink
                              key={item.href}
                              item={item}
                              onNavigate={() => setOpenGroupId(null)}
                            />
                          ))}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              ))}

              <Link
                href="/people"
                className="rounded px-3 py-2 font-sans text-[13px] text-cream/70 transition-colors hover:bg-white/5 hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60"
              >
                People
              </Link>
              <Link
                href="/about"
                className="rounded px-3 py-2 font-sans text-[13px] text-cream/70 transition-colors hover:bg-white/5 hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60"
              >
                About
              </Link>
            </nav>
            <HeaderSearchButton />
          </div>

          <div className="flex items-center gap-1 shrink-0 lg:hidden">
            <HeaderSearchButton />
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-nav"
              className="inline-flex h-12 w-12 items-center justify-center rounded-sm text-cream transition-colors hover:text-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60"
            >
              <HamburgerIcon />
            </button>
          </div>
        </div>
      </header>

      <div aria-hidden className="h-14 md:h-16" />

      <MobileNav
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
    </>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden
      className={[
        "mt-0.5 shrink-0 text-cream/55 transition-transform duration-200",
        open ? "rotate-180" : "rotate-0",
      ].join(" ")}
    >
      <path
        d="M2 3.5L5 6.5L8 3.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NavDropdownLink({
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
      className="flex cursor-pointer items-start gap-2.5 rounded-[6px] px-2.5 py-2 text-left transition-colors hover:bg-charcoal/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/50"
    >
      <span
        className="flex h-5 w-4 shrink-0 items-start justify-center text-sm leading-none"
        aria-hidden
      >
        {item.icon}
      </span>
      <span className="min-w-0">
        <span className="block font-sans text-[13px] font-medium leading-tight text-charcoal">
          {item.name}
        </span>
        <span className="mt-0.5 block font-sans text-[11px] leading-snug text-charcoal/55">
          {item.desc}
        </span>
      </span>
    </Link>
  );
}

function HamburgerIcon() {
  return (
    <svg
      width="22"
      height="14"
      viewBox="0 0 22 14"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <line x1="0" y1="1" x2="22" y2="1" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
      <line x1="0" y1="7" x2="22" y2="7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
      <line x1="0" y1="13" x2="22" y2="13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
    </svg>
  );
}
