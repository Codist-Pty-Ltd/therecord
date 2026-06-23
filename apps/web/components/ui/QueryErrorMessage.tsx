export function QueryErrorMessage({
  error,
  fallback = "Something went wrong. Please try again.",
}: {
  error: unknown;
  fallback?: string;
}) {
  const message =
    error instanceof Error && error.message.trim().length > 0
      ? error.message
      : fallback;

  return (
    <p
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
    >
      {message}
    </p>
  );
}
