/**
 * Site footer — server component. Legal links row required for POPIA visibility.
 */
import Link from "next/link";

import BuildInfo from "@/components/Layout/BuildInfo";

const LEGAL_LINKS: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
  { href: "/editorial", label: "Editorial Standards" },
  { href: "/takedown", label: "Content Removal" },
  { href: "/about", label: "About" },
  { href: "/api/feed.xml", label: "RSS" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-charcoal/10 mt-16 md:mt-24">
      <div className="mx-auto max-w-6xl px-4 md:px-8 py-8 md:py-12 flex flex-col gap-6">
        <nav
          aria-label="Legal and policies"
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center font-sans text-xs text-charcoal/75"
        >
          {LEGAL_LINKS.map((link, i) => (
            <span key={link.href} className="inline-flex items-center gap-x-3">
              {i > 0 ? (
                <span className="text-charcoal/30 select-none" aria-hidden>
                  ·
                </span>
              ) : null}
              <Link
                href={link.href}
                className="text-charcoal/80 hover:text-amber transition-colors underline-offset-4 hover:underline"
              >
                {link.label}
              </Link>
            </span>
          ))}
        </nav>

        <div className="flex flex-col items-center gap-1.5 text-center font-sans text-[11px] text-charcoal/50">
          <p>© {year} Codist (Pty) Ltd · South Africa</p>
          <p>
            Privacy-first analytics (no cookies). No advertising or third-party
            trackers.
          </p>
          <BuildInfo />
        </div>
      </div>
    </footer>
  );
}
