"use client";

import Link from "next/link";

export type EmptyStateIcon = "📰" | "👤" | "⚖️" | "🏛️" | "🔍";

export interface EmptyStateProps {
  heading: string;
  body: string;
  action?: { label: string; href: string };
  icon?: EmptyStateIcon;
  /** Extra classes for the outer wrapper (e.g. `py-10` when nested). */
  className?: string;
}

const ICON_CLASS = "text-[32px] leading-none select-none";

/**
 * Warm, editorial empty state — not an error, nothing broken.
 */
export default function EmptyState({
  heading,
  body,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`bg-cream px-4 ${className != null && className !== "" ? className : "py-20"}`}
    >
      <div className="mx-auto flex w-full max-w-lg flex-col items-center text-center">
        {icon ? (
          <span className={ICON_CLASS} aria-hidden>
            {icon}
          </span>
        ) : null}
        <h2
          className={`font-serif text-xl text-charcoal leading-snug md:text-2xl ${
            icon ? "mt-4" : ""
          }`}
        >
          {heading}
        </h2>
        <p className="mt-3 max-w-[400px] font-sans text-sm leading-relaxed text-charcoal/60">
          {body}
        </p>
        {action ? (
          <Link
            href={action.href}
            className="mt-7 font-mono text-[12px] uppercase tracking-[0.14em] text-amber transition-colors hover:underline underline-offset-4"
          >
            {action.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
