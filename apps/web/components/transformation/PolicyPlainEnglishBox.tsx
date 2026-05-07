"use client";

import PlainEnglishBox, {
  type PlainEnglishBoxProps,
} from "@/components/ui/PlainEnglishBox";

import { useTransformationReadingLevel } from "./ReadingLevelContext";

/** Renders policy `plain_english_*` for the active page reading level. */
export function PolicyPlainEnglishBox({
  plainEnglishChild,
  plainEnglishLayperson,
  plainEnglishLegal,
  className,
  collapsible = false,
  collapseMobileOnly,
  defaultOpen,
}: {
  plainEnglishChild: string;
  plainEnglishLayperson: string;
  plainEnglishLegal: string;
} & Partial<
  Pick<
    PlainEnglishBoxProps,
    "className" | "collapsible" | "collapseMobileOnly" | "defaultOpen"
  >
>) {
  const { level } = useTransformationReadingLevel();
  const text =
    level === "child"
      ? plainEnglishChild
      : level === "legal"
        ? plainEnglishLegal
        : plainEnglishLayperson;

  return (
    <PlainEnglishBox
      text={text}
      level={level}
      className={className}
      collapsible={collapsible}
      collapseMobileOnly={collapseMobileOnly}
      defaultOpen={defaultOpen}
    />
  );
}