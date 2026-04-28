"use client";

import { useEffect } from "react";

import ErrorState from "@/components/ui/ErrorState";

export default function LawsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[laws] render failed:", error);
    }
  }, [error]);

  return (
    <ErrorState
      title="Something went wrong"
      message="We couldn't load the laws index. Please try again."
      onRetry={reset}
      errorDigest={error.digest}
    />
  );
}
