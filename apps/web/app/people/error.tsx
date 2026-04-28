"use client";

import { useEffect } from "react";

import ErrorState from "@/components/ui/ErrorState";

export default function PeopleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[people] render failed:", error);
    }
  }, [error]);

  return (
    <ErrorState
      title="Something went wrong"
      message="We couldn't load the people directory. Please try again."
      onRetry={reset}
      errorDigest={error.digest}
    />
  );
}
