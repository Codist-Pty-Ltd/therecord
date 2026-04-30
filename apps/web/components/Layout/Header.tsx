"use client";

import Link from "next/link";
import { useState } from "react";

import { HeaderSearchButton } from "./HeaderSearchButton";
import MobileNav from "./MobileNav";

/**
 * Desktop nav items. Rendered inline on `lg:` breakpoints; hidden on mobile
 * where they live inside the slide-out drawer (`MobileNav`).
 */
const DESKTOP_NAV_LINKS: ReadonlyArray<{
  readonly href: string;
  readonly label: string;
}> = [
  { href: "/stories", label: "Stories" },
  { href: "/provinces", label: "Provinces" },
  { href: "/commissions", label: "Commissions" },
  { href: "/siu", label: "SIU" },
  { href: "/laws", label: "Laws" },
  { href: "/people", label: "People" },
  { href: "/about", label: "About" },
];

/**
 * Fixed site header. Owns the open/closed state of the mobile nav drawer.
 *
 * Layout notes:
 *  - `position: fixed` means this sits on top of the document flow, so we
 *    render a matching-height spacer sibling to prevent the first section
 *    of each page from being hidden underneath it.
 *  - The header keeps the same charcoal fill on every page so the wordmark
 *    and nav have consistent contrast regardless of what's behind it.
 */
export default function Header() {
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);

  return (
    <>
      <header
        role="banner"
        className="fixed top-0 inset-x-0 z-50 bg-charcoal"
      >
        <div className="mx-auto max-w-6xl px-4 md:px-8 h-14 md:h-16 flex items-center justify-between gap-4 min-w-0">
          {/* Wordmark */}
          <Link
            href="/"
            aria-label="The Record — home"
            className="shrink-0 font-mono text-[14px] tracking-[0.22em] uppercase text-cream hover:text-amber transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60 rounded-sm"
          >
            THE RECORD
          </Link>

          {/* Desktop: primary nav + search */}
          <div className="hidden lg:flex flex-1 min-w-0 items-center justify-end gap-6">
            <nav
              aria-label="Primary"
              className="flex items-center gap-8 font-mono text-[12px] tracking-[0.18em] uppercase"
            >
              {DESKTOP_NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-cream/80 hover:text-amber transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60 rounded-sm"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <HeaderSearchButton />
          </div>

          {/* Mobile: search, then hamburger */}
          <div className="flex lg:hidden items-center shrink-0 gap-1">
            <HeaderSearchButton />
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-nav"
              className="w-12 h-12 inline-flex items-center justify-center text-cream hover:text-amber transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60 rounded-sm"
            >
              <HamburgerIcon />
            </button>
          </div>
        </div>
      </header>

      {/* Spacer — same height as the fixed header, so page content doesn't
          sit underneath the bar. Kept as a sibling (not a wrapper) so the
          drawer can still cover the entire viewport. */}
      <div aria-hidden className="h-14 md:h-16" />

      <MobileNav
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
    </>
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
