import Link from "next/link";

type PageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function NewsletterConfirmedPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const already = params.status === "already";

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-charcoal/50">
        Newsletter
      </p>
      <h1 className="mt-3 font-serif text-3xl text-charcoal">
        {already ? "Already subscribed" : "You're subscribed to The Record"}
      </h1>
      <p className="mt-4 font-sans text-sm text-charcoal/70">
        {already
          ? "This email address was already confirmed. You'll continue receiving our weekly digest."
          : "You'll receive our weekly digest every Monday with the latest accountability journalism from South Africa."}
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
