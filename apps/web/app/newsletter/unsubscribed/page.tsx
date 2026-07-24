import Link from "next/link";

export default function NewsletterUnsubscribedPage() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-charcoal/50">
        Newsletter
      </p>
      <h1 className="mt-3 font-serif text-3xl text-charcoal">You&apos;ve been unsubscribed</h1>
      <p className="mt-4 font-sans text-sm text-charcoal/70">
        Sorry to see you go. You can resubscribe any time from the homepage or footer.
      </p>
      <Link
        href="/"
        className="mt-8 font-mono text-[12px] uppercase tracking-[0.14em] text-amber hover:underline underline-offset-4"
      >
        ← Back to home
      </Link>
    </div>
  );
}
