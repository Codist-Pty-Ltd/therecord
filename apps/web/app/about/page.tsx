import type { Metadata } from "next";
import Link from "next/link";

import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "The Record is a South African legal intelligence platform. We connect incidents to investigations, charges, and outcomes — in plain English.",
  alternates: { canonical: `${SITE_URL}/about` },
};

export default function AboutPage() {
  return (
    <article className="max-w-[680px] mx-auto px-4 md:px-6 py-16 md:py-24 text-charcoal">
      <h1 className="font-serif text-[2.5rem] md:text-[2.75rem] leading-tight tracking-tight">
        About The Record
      </h1>

      <div className="mt-12 md:mt-16 flex flex-col gap-14 md:gap-20 font-sans text-[1.05rem] md:text-lg leading-[1.8] text-charcoal/90">
        <section className="flex flex-col gap-5">
          <h2 className="font-serif text-2xl md:text-3xl text-charcoal">
            What is The Record?
          </h2>
          <p>
            A South African legal intelligence platform. Not just news — the
            full story of how events become investigations, how investigations
            produce charges, and whether anyone is ever held accountable.
          </p>
        </section>

        <section className="flex flex-col gap-5">
          <h2 className="font-serif text-2xl md:text-3xl text-charcoal">
            Why it exists
          </h2>
          <p>
            Courts happen. Commissions report. Laws are applied. But the thread
            connecting an incident in 2012 to a conviction in 2024 is scattered
            across hundreds of articles, official gazettes, and judgment PDFs.{" "}
            The Record connects it all in one place.
          </p>
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="font-serif text-2xl md:text-3xl text-charcoal">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            <div>
              <p className="mb-3 text-2xl" aria-hidden>
                📰
              </p>
              <p>We track news as it happens.</p>
            </div>
            <div>
              <p className="mb-3 text-2xl" aria-hidden>
                ⚖️
              </p>
              <p>We map charges to the laws that apply.</p>
            </div>
            <div>
              <p className="mb-3 text-2xl" aria-hidden>
                🧵
              </p>
              <p>We build the thread — from first report to final outcome.</p>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <h2 className="font-serif text-2xl md:text-3xl text-charcoal">
            The plain English promise
          </h2>
          <p>
            Every legal concept on this platform is explained at three levels:
            for a child, for an adult, and for a lawyer. Because accountability
            shouldn&apos;t require a law degree.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-serif text-2xl md:text-3xl text-charcoal">
            Built by Codist
          </h2>
          <p>
            <Link
              href="https://codist.co.za"
              className="underline decoration-amber decoration-2 underline-offset-[5px] hover:text-amber transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              codist.co.za
            </Link>
          </p>
        </section>

        <section className="flex flex-col gap-5">
          <h2 className="font-serif text-2xl md:text-3xl text-charcoal">
            A note on accuracy
          </h2>
          <p>
            We distinguish between allegations and findings. We distinguish
            between charged and convicted. The Constitution&apos;s presumption
            of innocence applies here just as it does in court.
          </p>
        </section>

        <section className="flex flex-col gap-5 pt-4 border-t border-charcoal/10">
          <h2 className="font-sans text-base font-medium tracking-[0.02em] uppercase text-charcoal">
            Legal &amp; editorial
          </h2>
          <div className="flex flex-col gap-4 font-sans text-[15px] leading-[1.8] text-charcoal/90">
            <p>
              <span className="font-medium text-charcoal">Who runs this:</span>{" "}
              The Record is built and operated by Codist (Pty) Ltd, Johannesburg,
              South Africa.
            </p>
            <p>
              <span className="font-medium text-charcoal">Editorial approach:</span>{" "}
              We distinguish between allegations, charges, and convictions. We link
              to primary sources. We show brief excerpts, never full articles. We
              explain legal concepts — we do not provide legal advice.
            </p>
            <p>
              <span className="font-medium text-charcoal">Our commitment:</span>{" "}
              We will correct factual errors. Contact:{" "}
              <a
                href="mailto:editorial@therecord.co.za"
                className="underline decoration-amber decoration-2 underline-offset-[5px] hover:text-amber transition-colors"
              >
                editorial@therecord.co.za
              </a>
            </p>
            <p>
              <span className="font-medium text-charcoal">
                Information Officer (POPIA):
              </span>{" "}
              [your name] —{" "}
              <a
                href="mailto:privacy@therecord.co.za"
                className="underline decoration-amber decoration-2 underline-offset-[5px] hover:text-amber transition-colors"
              >
                privacy@therecord.co.za
              </a>
            </p>
            <p>
              <Link
                href="/privacy"
                className="underline decoration-amber decoration-2 underline-offset-[5px] hover:text-amber transition-colors"
              >
                Privacy Policy
              </Link>
              {" · "}
              <Link
                href="/terms"
                className="underline decoration-amber decoration-2 underline-offset-[5px] hover:text-amber transition-colors"
              >
                Terms of Use
              </Link>
              {" · "}
              <Link
                href="/editorial"
                className="underline decoration-amber decoration-2 underline-offset-[5px] hover:text-amber transition-colors"
              >
                Editorial standards
              </Link>
              {" · "}
              <Link
                href="/takedown"
                className="underline decoration-amber decoration-2 underline-offset-[5px] hover:text-amber transition-colors"
              >
                Content removal
              </Link>
            </p>
          </div>
        </section>
      </div>
    </article>
  );
}
