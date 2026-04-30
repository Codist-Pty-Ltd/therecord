import type { Metadata } from "next";

import {
  LegalDocumentLayout,
  LegalSection,
} from "@/components/Legal/LegalDocumentLayout";
import TakedownForm from "@/components/Legal/TakedownForm";
import { SITE_URL } from "@/lib/site";

const LAST_UPDATED = "25 April 2026";

export const metadata: Metadata = {
  title: "Content Removal & Copyright",
  description:
    "How to request content removal, copyright takedowns, factual corrections, and POPIA requests for The Record.",
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE_URL}/takedown` },
};

export default function TakedownPage() {
  return (
    <LegalDocumentLayout title="Content Removal & Copyright" lastUpdated={LAST_UPDATED}>
      <LegalSection title="Submit a request">
        <p>
          Use this form to open a formal request. You will receive a reference
          number on submission. You can still email us directly if you prefer; the
          addresses in each section below remain valid.
        </p>
        <TakedownForm />
      </LegalSection>

      <LegalSection title="Copyright complaints">
        <p>
          If you are the copyright owner of content that appears on The Record
          without authorisation, contact us:
        </p>
        <p>
          Email:{" "}
          <a
            href="mailto:legal@therecord.co.za?subject=Copyright%20Complaint"
            className="underline decoration-amber decoration-1 underline-offset-[3px] hover:text-amber transition-colors"
          >
            legal@therecord.co.za
          </a>
        </p>
        <p>Subject line: &quot;Copyright Complaint — [URL of content]&quot;</p>
        <p>Please include:</p>
        <ul>
          <li>Your name and contact details</li>
          <li>Description of the copyrighted work</li>
          <li>URL where the content appears on our platform</li>
          <li>Statement that you are the rights holder or authorised agent</li>
        </ul>
        <p>
          We will respond within 5 business days and remove or restrict access
          to disputed content while we investigate.
        </p>
      </LegalSection>

      <LegalSection title="Factual corrections">
        <p>
          If you are a named individual and believe factual information about you
          is incorrect:
        </p>
        <p>
          Email:{" "}
          <a
            href="mailto:editorial@therecord.co.za?subject=Factual%20Correction"
            className="underline decoration-amber decoration-1 underline-offset-[3px] hover:text-amber transition-colors"
          >
            editorial@therecord.co.za
          </a>
        </p>
        <p>Subject: &quot;Factual Correction — [Your name]&quot;</p>
        <p>Please provide:</p>
        <ul>
          <li>The specific factual error</li>
          <li>Evidence supporting the correction</li>
          <li>URL of the page containing the error</li>
        </ul>
        <p>
          We take accuracy seriously and will correct genuine errors promptly.
        </p>
      </LegalSection>

      <LegalSection title="POPIA requests">
        <p>
          To exercise your rights under the Protection of Personal Information Act
          4 of 2013:
        </p>
        <p>
          Email:{" "}
          <a
            href="mailto:privacy@therecord.co.za"
            className="underline decoration-amber decoration-1 underline-offset-[3px] hover:text-amber transition-colors"
          >
            privacy@therecord.co.za
          </a>
        </p>
        <p>
          You may request: access to your data, correction, deletion, or object
          to processing.
        </p>
        <p>We will respond within 30 days as required by POPIA.</p>
      </LegalSection>

      <LegalSection title="Information Regulator">
        <p>If you are not satisfied with our response, you may escalate to:</p>
        <p>
          The Information Regulator (South Africa)
          <br />
          Email:{" "}
          <a
            href="mailto:inforeg@justice.gov.za"
            className="underline decoration-amber decoration-1 underline-offset-[3px] hover:text-amber transition-colors"
          >
            inforeg@justice.gov.za
          </a>
          <br />
          Tel: 010 023 5200
          <br />
          Website:{" "}
          <a
            href="https://www.inforegulator.org.za"
            className="underline decoration-amber decoration-1 underline-offset-[3px] hover:text-amber transition-colors"
            rel="noopener noreferrer"
            target="_blank"
          >
            www.inforegulator.org.za
          </a>
        </p>
      </LegalSection>
    </LegalDocumentLayout>
  );
}
