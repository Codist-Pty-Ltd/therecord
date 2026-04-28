"use client";

import Link from "next/link";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  action?: { label: string; href: string };
  /** Shown as a primary button when the route error boundary provides `reset`. */
  onRetry?: () => void;
  /** Next.js error digest for support (optional). */
  errorDigest?: string;
}

const DEFAULT_TITLE = "Something went wrong";
const DEFAULT_MESSAGE =
  "We couldn't load this content. Please try again.";
const DEFAULT_ACTION: { label: string; href: string } = {
  label: "← Back to home",
  href: "/",
};

/**
 * Shared layout for App Router `error.tsx` boundaries — never leaks raw
 * exception text to the reader.
 */
export default function ErrorState({
  title = DEFAULT_TITLE,
  message = DEFAULT_MESSAGE,
  action = DEFAULT_ACTION,
  onRetry,
  errorDigest,
}: ErrorStateProps) {
  return (
    <div className="bg-cream min-h-[70vh] flex flex-col items-center justify-center px-4 py-20">
      <div
        className="flex w-full max-w-lg flex-col items-center text-center"
        role="alert"
      >
        <div className="mb-7 h-12 w-12" aria-hidden>
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="24"
              cy="24"
              r="20"
              className="stroke-charcoal/10"
              strokeWidth="1.5"
            />
            <path
              d="M24 32v-14M24 12v.01"
              className="stroke-charcoal/25"
              strokeWidth="2.25"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h1 className="font-serif text-2xl text-charcoal leading-snug">
          {title}
        </h1>
        <p className="mt-3 max-w-[400px] font-sans text-sm leading-relaxed text-charcoal/60">
          {message}
        </p>

        {errorDigest ? (
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-charcoal/35">
            Reference · {errorDigest}
          </p>
        ) : null}

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="font-mono text-[12px] uppercase tracking-[0.14em] text-amber transition-colors hover:underline underline-offset-4"
            >
              Try again
            </button>
          ) : null}
          <Link
            href={action.href}
            className="font-mono text-[12px] uppercase tracking-[0.14em] text-amber transition-colors hover:underline underline-offset-4"
          >
            {action.label}
          </Link>
        </div>
      </div>
    </div>
  );
}
