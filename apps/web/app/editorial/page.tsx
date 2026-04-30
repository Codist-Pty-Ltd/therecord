import type { Metadata } from "next";

import {
  LegalDocumentLayout,
  LegalSection,
} from "@/components/Legal/LegalDocumentLayout";
import { SITE_URL } from "@/lib/site";

const LAST_UPDATED = "25 April 2026";

export const metadata: Metadata = {
  title: "Editorial Standards",
  description:
    "How The Record handles information about people and events — allegations, charges, findings, and POPIA Section 7 public interest journalism.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${SITE_URL}/editorial` },
};

export default function EditorialPage() {
  return (
    <LegalDocumentLayout title="Editorial Standards" lastUpdated={LAST_UPDATED}>
      <p className="font-serif text-xl md:text-2xl text-charcoal/95 -mt-2 md:-mt-4 mb-2">
        How The Record handles information about people and events
      </p>

      <LegalSection title="Our purpose">
        <p>
          The Record covers official South African accountability processes —
          commissions of inquiry, parliamentary committees, SIU investigations,
          and related legal proceedings. These are matters of public record
          established by the state under constitutional authority.
        </p>
        <p>
          We are not a gossip platform. We do not cover private lives. We cover
          public officials in their public roles.
        </p>
      </LegalSection>

      <LegalSection title="How we handle allegations">
        <p>We distinguish clearly between:</p>
        <p>
          <span className="font-medium text-charcoal">Allegations</span> — claims
          made by witnesses, media, or investigators that have not been proven.
          Always labelled as such.
        </p>
        <p>
          <span className="font-medium text-charcoal">Charges</span> — formal
          criminal or disciplinary charges filed through official legal
          processes. Factual status, not a finding of guilt.
        </p>
        <p>
          <span className="font-medium text-charcoal">Findings</span> —
          conclusions reached by a commission or court after due process. We
          report these accurately.
        </p>
        <p>
          <span className="font-medium text-charcoal">Convictions</span> — proven
          in a court of law. The constitutional presumption of innocence applies
          until this point.
        </p>
      </LegalSection>

      <LegalSection title="How we handle information about people">
        <p>
          We publish information about individuals only in relation to their
          public roles and official proceedings.
        </p>
        <p>We do not publish:</p>
        <ul>
          <li>Home addresses or private contact details</li>
          <li>
            Information about family members not involved in proceedings
          </li>
          <li>
            Medical information (unless directly relevant to fitness for office)
          </li>
          <li>
            Information about private conduct unrelated to public role
          </li>
        </ul>
        <p>We do publish:</p>
        <ul>
          <li>Roles and positions held</li>
          <li>Testimony given at official proceedings</li>
          <li>Findings made about them by official bodies</li>
          <li>Charges and their legal basis</li>
        </ul>
      </LegalSection>

      <LegalSection title="Corrections">
        <p>
          We correct factual errors promptly. Email:{" "}
          <a
            href="mailto:editorial@therecord.co.za"
            className="underline decoration-amber decoration-1 underline-offset-[3px] hover:text-amber transition-colors"
          >
            editorial@therecord.co.za
          </a>
          . Corrections are noted on the relevant page.
        </p>
      </LegalSection>

      <LegalSection title="Public interest basis">
        <p>
          Our work falls within the journalism and public interest exemption
          under Section 7 of POPIA. We process information about public figures in
          their public capacity to advance democratic accountability.
        </p>
      </LegalSection>
    </LegalDocumentLayout>
  );
}
