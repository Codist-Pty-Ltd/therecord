"use client";

import type { ComponentProps } from "react";

import { trackDocumentDownload } from "@/lib/umami";

interface TrackedExternalLinkProps extends ComponentProps<"a"> {
  documentName: string;
}

/** External PDF / report link with Umami document-download event. */
export default function TrackedExternalLink({
  documentName,
  onClick,
  children,
  ...rest
}: TrackedExternalLinkProps) {
  return (
    <a
      {...rest}
      onClick={(e) => {
        trackDocumentDownload(documentName);
        onClick?.(e);
      }}
    >
      {children}
    </a>
  );
}
