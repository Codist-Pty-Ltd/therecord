/**
 * /person/[id] — a single person's complete public record.
 *
 * Server Component. Fetches the full person dossier (story appearances,
 * commission appearances, merged timeline events) and renders:
 *
 *   HEADER
 *   CAREER TIMELINE  — the signature feature: one merged chronology
 *   LEGAL STATUS     — conditional panel with the s35(3)(h) disclaimer
 *   COMMISSIONS      — row list grouped by (commission × role)
 *   STORIES          — row list of every story this person is named in
 *
 * For someone like Jacob Zuma, this is the view that collapses the
 * Hefer → Seriti → Zondo → criminal-trial arc into a single readable thread.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PersonCareerTimeline from "@/components/Person/PersonCareerTimeline";
import PersonCommissionsList from "@/components/Person/PersonCommissionsList";
import PersonHeader from "@/components/Person/PersonHeader";
import PersonLegalStatus from "@/components/Person/PersonLegalStatus";
import PersonStoriesList from "@/components/Person/PersonStoriesList";
import { ApiError, getPerson } from "@/lib/api";

export const dynamic = "force-dynamic";

/*
 * Next 15 passes `params` as a Promise — it must be awaited in async server
 * components and metadata functions.
 */
interface PersonPageParams {
  id: string;
}

interface PersonPageProps {
  params: Promise<PersonPageParams>;
}

// -----------------------------------------------------------------------------
// Metadata
// -----------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: PersonPageProps): Promise<Metadata> {
  const { id } = await params;

  let person: Awaited<ReturnType<typeof getPerson>> = null;
  try {
    person = await getPerson(id);
  } catch (err) {
    /* Bad UUIDs raise an ApiError (400) from Nest. Don't crash metadata; let
     * the page component surface the proper 404. */
    if (!(err instanceof ApiError)) throw err;
  }

  if (!person) {
    return {
      title: "Profile not found — The Record",
      robots: { index: false, follow: false },
    };
  }

  const canonicalUrl = `https://therecord.co.za/person/${person.id}`;
  const roleForSeo = person.current_role?.trim() || "Public figure";
  const defaultDescription = `${person.full_name} — ${roleForSeo}. Track their role across South African commissions and investigations.`;
  const description =
    person.profile_summary?.trim() || defaultDescription;

  return {
    title: person.full_name,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: person.full_name,
      description,
      url: canonicalUrl,
      siteName: "The Record",
      locale: "en_ZA",
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: person.full_name,
      description,
    },
  };
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default async function PersonPage({ params }: PersonPageProps) {
  const { id } = await params;

  let person: Awaited<ReturnType<typeof getPerson>> = null;
  try {
    person = await getPerson(id);
  } catch (err) {
    /* A 400 from the API means the URL is malformed — treat it as a 404
     * from the reader's perspective rather than blowing up the error
     * boundary. Any other error propagates to `error.tsx`. */
    if (err instanceof ApiError && err.status === 400) {
      notFound();
    }
    throw err;
  }

  if (!person) notFound();

  return (
    <article className="bg-cream text-charcoal">
      <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <PersonHeader person={person} />
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <PersonCareerTimeline person={person} />
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <PersonLegalStatus
          personName={person.full_name}
          events={person.events}
          stories={person.stories}
        />
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <PersonCommissionsList
          personName={person.full_name}
          commissions={person.commissions}
        />
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 pb-12 md:pb-16">
        <PersonStoriesList
          personName={person.full_name}
          stories={person.stories}
        />
      </div>
    </article>
  );
}
