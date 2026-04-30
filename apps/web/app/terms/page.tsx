import type { Metadata } from "next";

import {
  LegalDocumentLayout,
  LegalSection,
} from "@/components/Legal/LegalDocumentLayout";
import { SITE_URL } from "@/lib/site";

const LAST_UPDATED = "25 April 2026";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Terms of Use for The Record — public interest research platform operated by Codist (Pty) Ltd.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${SITE_URL}/terms` },
};

export default function TermsPage() {
  return (
    <LegalDocumentLayout title="Terms of Use" lastUpdated={LAST_UPDATED}>
      <LegalSection title="What The Record is">
        <p>
          The Record is a public interest research platform that tracks South
          African accountability bodies — commissions of inquiry, parliamentary
          committees, SIU investigations, and related legal proceedings. It is
          operated by Codist (Pty) Ltd.
        </p>
      </LegalSection>

      <LegalSection title="Content and sources">
        <ul>
          <li>
            All news content is sourced from publicly available sources and
            displayed as brief excerpts with attribution and links to originals.
          </li>
          <li>We do not publish full articles. We do not rewrite articles.</li>
          <li>
            Commission reports, legal texts, and constitutional provisions are
            public domain documents.
          </li>
          <li>
            Structured data (timelines, people profiles, law mappings) is
            created by our editorial team based on public records.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Accuracy and disclaimer">
        <ul>
          <li>
            The Record strives for accuracy but does not warrant that all
            information is complete, current, or error-free.
          </li>
          <li>
            Nothing on this platform constitutes legal, financial, or
            professional advice.
          </li>
          <li>
            Content about ongoing investigations and court proceedings reflects
            information available at the time of publication.
          </li>
          <li>
            The Record clearly distinguishes between allegations (not proven),
            charges (formal legal process initiated), and convictions (proven in
            court). The constitutional presumption of innocence applies
            throughout.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Intellectual property">
        <ul>
          <li>
            The Record&apos;s original content (timelines, structured data, plain
            English explanations, editorial summaries) is owned by Codist (Pty)
            Ltd and protected by copyright.
          </li>
          <li>
            Third-party content remains the property of its original owners.
          </li>
          <li>You may share links to The Record freely.</li>
          <li>
            You may not scrape, reproduce, or republish our structured data
            without written permission.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Limitation of liability">
        <p>
          To the maximum extent permitted by South African law: Codist (Pty) Ltd
          is not liable for any loss or damage arising from reliance on content
          published on The Record. We are not responsible for the accuracy of
          third-party sources we link to. We are not responsible for content on
          external websites.
        </p>
      </LegalSection>

      <LegalSection title="Content removal">
        <p>
          If you believe content on The Record infringes your copyright, is
          factually incorrect about you specifically, or violates your rights
          under POPIA, contact:{" "}
          <a
            href="mailto:legal@therecord.co.za"
            className="underline decoration-amber decoration-1 underline-offset-[3px] hover:text-amber transition-colors"
          >
            legal@therecord.co.za
          </a>
          . We will respond within 5 business days.
        </p>
      </LegalSection>

      <LegalSection title="Governing law">
        <p>
          These terms are governed by the laws of the Republic of South Africa.
          Any disputes will be resolved in the courts of South Africa.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We reserve the right to update these terms. Continued use of the
          platform constitutes acceptance.
        </p>
      </LegalSection>
    </LegalDocumentLayout>
  );
}
