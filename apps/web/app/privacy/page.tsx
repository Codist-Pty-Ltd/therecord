import type { Metadata } from "next";

import {
  LegalDocumentLayout,
  LegalSection,
} from "@/components/Legal/LegalDocumentLayout";
import { SITE_URL } from "@/lib/site";

const LAST_UPDATED = "25 April 2026";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for The Record — operated by Codist (Pty) Ltd, Republic of South Africa. POPIA-aligned practices.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${SITE_URL}/privacy` },
};

export default function PrivacyPage() {
  return (
    <LegalDocumentLayout title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <LegalSection title="Who we are">
        <p>
          The Record is operated by Codist (Pty) Ltd, a South African company.
          Our Information Officer is [your name], contactable at{" "}
          <a
            href="mailto:privacy@therecord.co.za"
            className="underline decoration-amber decoration-1 underline-offset-[3px] hover:text-amber transition-colors"
          >
            privacy@therecord.co.za
          </a>
          .
        </p>
        <p>
          We are registered with the Information Regulator of South Africa.{" "}
          [Registration number once obtained]
        </p>
      </LegalSection>

      <LegalSection title="Jurisdiction">
        <p>This policy applies in the Republic of South Africa.</p>
      </LegalSection>

      <LegalSection title="What information we collect">
        <p>
          <span className="font-medium text-charcoal">Information you give us:</span> None
          currently. The Record has no user accounts, no registration, and no forms
          that collect personal information.
        </p>
        <p>
          <span className="font-medium text-charcoal">
            Information collected automatically:
          </span>
        </p>
        <ul>
          <li>
            Server logs: IP address, browser type, pages visited, time of visit.
            These are retained for 30 days for security purposes only.
          </li>
          <li>We do not use Google Analytics or any third-party analytics trackers.</li>
          <li>
            We do not use advertising trackers or sell data to any third party.
          </li>
        </ul>
        <p>
          <span className="font-medium text-charcoal">
            Information about public figures:
          </span>{" "}
          The Record publishes factual, publicly available information about
          individuals in their public capacity — their roles in commissions,
          investigations, and accountability processes. This falls within the
          journalism and public interest exemption under POPIA Section 7.
        </p>
      </LegalSection>

      <LegalSection title="Legal basis for processing (POPIA Section 11)">
        <ul>
          <li>Server logs: Legitimate interest (security and stability)</li>
          <li>
            Public figure information: Public interest / journalism exemption
          </li>
          <li>
            We do not process any personal information on a consent basis because
            we do not collect personal information from users.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Your rights under POPIA">
        <p>You have the right to:</p>
        <ul>
          <li>Request access to any personal information we hold about you</li>
          <li>Request correction of inaccurate information</li>
          <li>Request deletion of your information</li>
          <li>Object to processing of your information</li>
          <li>Lodge a complaint with the Information Regulator</li>
        </ul>
        <p>
          Contact:{" "}
          <a
            href="mailto:privacy@therecord.co.za"
            className="underline decoration-amber decoration-1 underline-offset-[3px] hover:text-amber transition-colors"
          >
            privacy@therecord.co.za
          </a>
        </p>
        <p>
          Information Regulator:{" "}
          <a
            href="mailto:inforeg@justice.gov.za"
            className="underline decoration-amber decoration-1 underline-offset-[3px] hover:text-amber transition-colors"
          >
            inforeg@justice.gov.za
          </a>{" "}
          | 010 023 5200
        </p>
      </LegalSection>

      <LegalSection title="Third-party content">
        <p>
          The Record links to and displays brief excerpts from third-party news
          sources. We do not store full article text. All third-party content
          remains the intellectual property of its original publishers.
        </p>
      </LegalSection>

      <LegalSection title="Data retention">
        <p>
          <span className="font-medium text-charcoal">Server logs:</span> 30 days
        </p>
        <p>
          <span className="font-medium text-charcoal">
            Public figure information:
          </span>{" "}
          Retained indefinitely as it constitutes a public record of
          accountability proceedings.
        </p>
      </LegalSection>

      <LegalSection title="International transfers">
        <p>
          Our servers are hosted in Germany (Hetzner Online GmbH). Hetzner is
          GDPR-compliant and operates under EU data protection law, which
          provides equivalent or greater protection than POPIA.
        </p>
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <p>
          We will notify users of material changes by updating the &quot;Last
          updated&quot; date above.
        </p>
      </LegalSection>
    </LegalDocumentLayout>
  );
}
