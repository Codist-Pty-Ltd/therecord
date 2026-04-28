"use client";

import { useEffect } from "react";

import ErrorState from "@/components/ui/ErrorState";

export default function SearchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[search] render failed:", error);
    }
  }, [error]);

  return (
    <ErrorState
      title="Something went wrong"
      message="We couldn't run that search. Please try again."
      onRetry={reset}
      errorDigest={error.digest}
    />
  );
}
