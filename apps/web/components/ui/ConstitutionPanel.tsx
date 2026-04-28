import type { LegalReference } from "@the-record/shared-types";

import LegalPanel from "./LegalPanel";

/**
 * ConstitutionPanel — LegalPanel with the constitutional-gold accent.
 * The title is always prefixed with "§ Constitution" if the caller's title
 * doesn't already start with it.
 */

interface ConstitutionPanelProps {
  /** Optional sub-title; "§ Constitution" is prepended automatically. */
  title?: string;
  references: LegalReference[];
  className?: string;
}

const PREFIX = "§ Constitution";

export default function ConstitutionPanel({
  title,
  references,
  className,
}: ConstitutionPanelProps) {
  const heading = buildHeading(title);

  return (
    <LegalPanel
      title={heading}
      references={references}
      variant="constitutional"
      className={className}
    />
  );
}

function buildHeading(subtitle: string | undefined): string {
  const trimmed = subtitle?.trim();
  if (!trimmed) return PREFIX;
  if (trimmed.startsWith(PREFIX)) return trimmed;
  return `${PREFIX} — ${trimmed}`;
}
