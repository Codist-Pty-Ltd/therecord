"use client";

import { type FormEvent, useState } from "react";

import { clientPost } from "@/lib/client-api";

type NewsletterSignupProps = {
  source: "footer" | "homepage";
  compact?: boolean;
};

export default function NewsletterSignup({
  source,
  compact = false,
}: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await clientPost<{ message: string }>("/api/newsletter/subscribe", {
        email: email.trim(),
        source,
      });
      setMessage(
        res.message === "Already subscribed"
          ? "You're already subscribed."
          : "Check your email to confirm your subscription.",
      );
      setEmail("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={
        compact
          ? "w-full max-w-md"
          : "w-full max-w-lg rounded-lg border border-charcoal/10 bg-white/60 p-6"
      }
    >
      {!compact ? (
        <>
          <h3 className="font-serif text-xl text-charcoal">Stay informed</h3>
          <p className="mt-2 font-sans text-sm text-charcoal/70">
            Weekly digest of South Africa&apos;s accountability journalism. No
            spam — unsubscribe any time.
          </p>
        </>
      ) : (
        <p className="font-sans text-xs text-charcoal/70 mb-3">
          Weekly accountability digest ·{" "}
          <a href="/api/feed.xml" className="underline hover:text-amber">
            RSS
          </a>
        </p>
      )}

      <form
        onSubmit={handleSubscribe}
        className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <label htmlFor={`newsletter-email-${source}`} className="sr-only">
          Email address
        </label>
        <input
          id={`newsletter-email-${source}`}
          type="email"
          required
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-w-0 flex-1 rounded border border-charcoal/20 bg-cream px-3 py-2 font-sans text-sm text-charcoal placeholder:text-charcoal/40 focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber/40"
        />
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded bg-charcoal px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-cream transition-colors hover:bg-charcoal/90 disabled:opacity-60"
        >
          {loading ? "Subscribing…" : "Subscribe"}
        </button>
      </form>

      {message ? (
        <p className="mt-3 font-sans text-sm text-emerald-800" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 font-sans text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
