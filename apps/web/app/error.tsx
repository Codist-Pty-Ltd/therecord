"use client";

import { useEffect } from "react";

import ErrorState from "@/components/ui/ErrorState";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[app] render failed:", error);
    }
  }, [error]);

  return (
    <ErrorState
      onRetry={reset}
      errorDigest={error.digest}
    />
  );
}
