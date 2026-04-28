"use client";

import { useEffect } from "react";

import ErrorState from "@/components/ui/ErrorState";

export default function LawSectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[law-section] render failed:", error);
    }
  }, [error]);

  return (
    <ErrorState
      title="Something went wrong"
      message="We couldn't load this section. You can try again or browse the full law index."
      action={{ label: "← All laws", href: "/laws" }}
      onRetry={reset}
      errorDigest={error.digest}
    />
  );
}
