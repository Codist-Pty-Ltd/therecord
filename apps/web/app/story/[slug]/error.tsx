"use client";

import { useEffect } from "react";

import ErrorState from "@/components/ui/ErrorState";

export default function StoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[story] render failed:", error);
    }
  }, [error]);

  return (
    <ErrorState
      title="Something went wrong"
      message="We couldn't load this story. Please try again, or return home."
      onRetry={reset}
      errorDigest={error.digest}
    />
  );
}
