import Link from "next/link";

import { DOMAINS } from "@/lib/domains";

interface DomainsStripProps {
  variant?: "dark" | "light";
  /** When true, renders as a horizontally-scrollable row on mobile. */
  scrollable?: boolean;
  className?: string;
}

/**
 * Reusable domain-tag strip used by the hero (dark variant) and the site
 * footer (light variant). Each tag links to `/domain/[slug]` so readers can
 * browse a single beat.
 */
export default function DomainsStrip({
  variant = "light",
  scrollable = false,
  className,
}: DomainsStripProps) {
  const tagBase =
    "inline-flex items-center gap-1.5 rounded-full whitespace-nowrap px-3 md:px-4 py-1.5 md:py-2 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] transition-colors";

  const tagTheme =
    variant === "dark"
      ? "bg-cream/5 text-cream/75 border border-cream/15 hover:bg-amber hover:text-charcoal hover:border-amber"
      : "bg-white text-charcoal/75 border border-charcoal/10 hover:bg-amber hover:text-cream hover:border-amber";

  const container = scrollable
    ? "flex flex-nowrap gap-2 md:gap-2.5 overflow-x-auto scrollbar-hidden -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap"
    : "flex flex-wrap gap-2 md:gap-2.5";

  return (
    <ul
      role="list"
      aria-label="Story domains"
      className={[container, className ?? ""].filter(Boolean).join(" ")}
    >
      {DOMAINS.map((domain) => (
        <li key={domain.value}>
          <Link href={`/domain/${domain.slug}`} className={`${tagBase} ${tagTheme}`}>
            <span aria-hidden className="text-[11px] leading-none">
              {domain.icon}
            </span>
            {domain.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
